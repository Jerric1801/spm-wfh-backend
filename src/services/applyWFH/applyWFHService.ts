// src/services/applyWFH/applyWFHService.ts
import pool from '../../config/db';  // Ensure this points to your database configuration
import { format, addDays, parseISO } from 'date-fns';
import AWS from 'aws-sdk';
import awsConfig from '../../config/aws';

export interface WorkFromHomeRequest {
    Staff_ID: number;
    dateRange: { startDate: string; endDate: string };
    wfhType: 'AM' | 'PM' | 'WD';
    reason: string;
    // document: File;
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

export const handleDocumentUpload = async (file: File) => {
    try {
        const s3 = new AWS.S3({ 
            accessKeyId: awsConfig.accessKeyId, 
            secretAccessKey: awsConfig.secretAccessKey,
            region: awsConfig.region
        });

        // Generate pre-signed URL
        const params = {
            Bucket: awsConfig.bucketName, 
            Key: file.name, 
            Expires: 900,  
            ContentType: file.type, 
        };

        const presignedUrl = await new Promise<string>((resolve, reject) => {
            s3.getSignedUrl('putObject', params, (err: Error, url: string) => { 
                if (err) {
                    reject(err);
                } else {
                    resolve(url);
                }
            });
        });

        // 3. Upload file to S3
        await fetch(presignedUrl, { 
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
            },
            body: file 
        });

        console.log('File uploaded successfully!');
    } catch (error) {
        console.error('Error uploading file:', error);   
    }
};