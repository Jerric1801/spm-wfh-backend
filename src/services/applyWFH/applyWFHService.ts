// src/services/applyWFH/applyWFHService.ts
import pool from '../../config/db';  // Ensure this points to your database configuration
import { format, addDays, parseISO } from 'date-fns';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import awsConfig from '../../config/aws';
import { Request, Response } from 'express';
import multer from 'multer';
import mime from 'mime-types'; 

export interface WorkFromHomeRequest {
    Staff_ID: number;
    dateRange: { startDate: string; endDate: string };
    wfhType: 'AM' | 'PM' | 'WD';
    reason: string;
    // document: File;
}

interface S3UploadParams {
    Bucket: string;
    Key: string;
    ContentType: string;
}

// Helper function to generate all dates between two dates
function getAllDatesInRange(start: string, end: string): string[] {
    const startDate = parseISO(start);
    const endDate = parseISO(end);
    const dates = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
        dates.push(format(currentDate, 'yyyy-MM-dd')); // Format as string
        currentDate = addDays(currentDate, 1); // Add one day
    }

    return dates;
}

export const applyForWorkFromHome = async (request: WorkFromHomeRequest) => {
    try {
        const dates = getAllDatesInRange(request.dateRange.startDate, request.dateRange.endDate);

        // Ensure sequence is correct
        await pool.query(`
            ALTER TABLE public."Request"
            ALTER COLUMN "Request_ID" SET DEFAULT nextval('public."Request_Request_ID_seq"')
        `);

        await pool.query(`
            SELECT setval('public."Request_Request_ID_seq"', (SELECT MAX("Request_ID") FROM public."Request"))
        `);

        // Generate a unique Request_ID
        const requestIdQuery = await pool.query('SELECT nextval(\'public."Request_Request_ID_seq"\'::regclass) AS "Request_ID"');
        const requestId = requestIdQuery.rows[0].Request_ID;

        console.log(requestIdQuery)
        console.log(requestId)

        // Insert the request into the Request table
        const requestQuery = await pool.query(
            'INSERT INTO public."Request" ("Request_ID", "Staff_ID", "Current_Status", "Created_At", "Last_Updated", "Request_Reason", "Manager_Reason") VALUES ($1, $2, $3, NOW(), NOW(), $4, $5)',
            [requestId, request.Staff_ID, 'Pending', request.reason, '']
        );

        console.log(requestQuery)

        // Insert the work-from-home details into the RequestDetails table for each date in the range
        const requestDetails = dates.map(date => ({
            Request_ID: requestId,
            Date: date,
            WFH_Type: request.wfhType
        }));

        // Bulk insert into RequestDetails
        // NOTE: WFH Request Reason is currently not included
        const columns = '("Request_ID", "Date", "WFH_Type")';
        const values = requestDetails.map(rd => `(${rd.Request_ID}, '${rd.Date}', '${rd.WFH_Type}')`).join(', ');
        const query = `INSERT INTO public."RequestDetails" ${columns} VALUES ${values}`;

        await pool.query(query);

        // Return the created request with details
        return {
            details: requestDetails
        };
    } catch (err) {
        console.error("Failed to apply for work-from-home:", err);
        throw err;
    }
};



export const handleDocumentUpload = async (req: Request, res: Response) => {
    try {
        const upload = multer();
        upload.single('file')(req, res, async (err: any) => {
            if (err) {
                console.error("Multer error:", err);
                return res.status(500).json({ message: 'Error processing file' });
            }

            if (!req.file) {
                return res.status(400).json({ message: 'No file uploaded' });
            }

            const s3Client = new S3Client({
                region: awsConfig.region,
                credentials: {
                    accessKeyId: awsConfig.accessKeyId,
                    secretAccessKey: awsConfig.secretAccessKey,
                },
            });

            const contentType = mime.lookup(req.file.originalname) || req.file.mimetype; 

            const params: S3UploadParams = {
                Bucket: awsConfig.bucketName,
                Key: `reasons/${req.file.originalname}`,
                ContentType: contentType
            };
            
            const command = new PutObjectCommand(params);
            const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 }); 

            const response = await fetch(presignedUrl, {
                method: 'PUT',
                headers: {
                    'Content-Type': contentType,
                },
                body: req.file.buffer
            });


            if (!response.ok) {
                console.error('S3 upload failed:', response.status, await response.text()); 
                return res.status(500).json({ 
                    message: 'File upload failed.',
                    error: 'Failed to upload file to S3.' 
                });
            }
            res.status(200).json({ message: 'File uploaded successfully!' });
        });
    } catch (error: any) { // Type error as any
        console.error('Error uploading file:', error);
        res.status(500).json({ message: 'Error uploading file' });
    }
};