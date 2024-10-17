// src/services/applyWFH/applyWFHService.ts
import pool from '../../config/db';  // Ensure this points to your database configuration
import { format, addDays, parseISO } from 'date-fns';

interface WorkFromHomeRequest {
    Staff_ID: number;
    dateRange: { startDate: string; endDate: string };
    wfhType: 'AM' | 'PM' | 'WD';
    reason: string;
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
            'INSERT INTO public."Request" ("Request_ID", "Staff_ID", "Current_Status", "Created_At", "Last_Updated") VALUES ($1, $2, $3, NOW(), NOW())',
            [requestId, request.Staff_ID, 'Pending']
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
