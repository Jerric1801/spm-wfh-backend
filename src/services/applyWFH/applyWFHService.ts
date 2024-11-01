// src/services/applyWFH/applyWFHService.ts
import pool from '../../config/db';  // Ensure this points to your database configuration
import { format, addDays, parseISO } from 'date-fns';

export interface WorkFromHomeRequest {
    Staff_ID: number;
    dateRange: { startDate: string; endDate: string };
    recurringDays: string[];
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

// Helper function to filter selected recurring dates
function filterSelectedDates(all_dates: string[], recurringDays: string[]): string[] {
    const dayMap = {
        'Su': 0, 
        'M' : 1, 
        'Tu': 2, 
        'W' : 3, 
        'Th': 4, 
        'F': 5, 
        'Sa': 6
    };

    const selectedDays = recurringDays.map(day => dayMap[day as keyof typeof dayMap]);

    return all_dates.filter(date => selectedDays.includes(new Date(date).getDay()));
}

// Helper function to check for conflicting request dates
async function checkForConflicts(dates: string[], staffId: number): Promise<boolean> {

    const currentRequestIdsResult = await pool.query(`
        SELECT "Request_ID" FROM public."Request" WHERE "Staff_ID" = $1
    `, [staffId]);
    
    console.log("CURRENT REQUEST IDs QUERY CALLED");

    if (!currentRequestIdsResult.rows) {
        return false; // no results so no conflicts
    }
    
    const requestIds = currentRequestIdsResult.rows.map(row => row.Request_ID);

    const conflictsResult = await pool.query(`
        SELECT "Date" FROM public."RequestDetails"
        WHERE "Request_ID" = ANY($1) AND "Date" = ANY($2)
    `, [requestIds, dates]);
    
    console.log("CONFLICT REQUEST QUERY CALLED");

    return conflictsResult.rowCount > 0;
}

// Main Function
export const applyForWorkFromHome = async (request: WorkFromHomeRequest) => {
    try {
        const all_dates = getAllDatesInRange(request.dateRange.startDate, request.dateRange.endDate);
        const dates = filterSelectedDates(all_dates, request.recurringDays);

        // Check for available dates after filtering
        if (dates.length === 0) {
            throw new Error("No suitable dates found.")
        }

        // Check for conflicting request dates
        const conflicts = await checkForConflicts(dates, request.Staff_ID);
        if (conflicts) {
            throw new Error("Conflicting request dates found.");
        }
        
        // Ensure sequence is correct
        await pool.query(`
            ALTER TABLE public."Request"
            ALTER COLUMN "Request_ID" SET DEFAULT nextval('public."Request_Request_ID_seq"')
        `);

        console.log("ALTER TABLE QUERY CALLED");

        await pool.query(`
            SELECT setval('public."Request_Request_ID_seq"', (SELECT MAX("Request_ID") FROM public."Request"))
        `);

        console.log("SELECT setval QUERY CALLED");
        
        // Generate a unique Request_ID
        const requestIdQuery = await pool.query('SELECT nextval(\'public."Request_Request_ID_seq"\') AS "Request_ID"');

        console.log("GENERATE REQUEST_ID QUERY CALLED");

        // Extract the Request_ID
        const requestId = requestIdQuery.rows[0].Request_ID;
        
        console.log(requestIdQuery)
        console.log(requestId)

        // Insert the request into the Request table
        const requestQuery = await pool.query(
            'INSERT INTO public."Request" ("Request_ID", "Staff_ID", "Current_Status", "Created_At", "Last_Updated", "Request_Reason", "Manager_Reason") VALUES ($1, $2, $3, NOW(), NOW(), $4, $5)',
            [requestId, request.Staff_ID, 'Pending', request.reason, '']
        );

        console.log("INSERT REQUEST QUERY CALLED; Success Status: ", requestQuery.rowCount > 0);
        
        // Insert the work-from-home details into the RequestDetails table for each date in the range
        const requestDetails = dates.map(date => ({
            Request_ID: requestId,
            Date: date,
            WFH_Type: request.wfhType
        }));

        // Bulk insert into RequestDetails
        // NOTE: WFH Request Reason is currently not included
        const details_columns = '("Request_ID", "Date", "WFH_Type")';
        const details_values = requestDetails.map(rd => `(${rd.Request_ID}, '${rd.Date}', '${rd.WFH_Type}')`).join(', ');

        const requestDetailsQuery = await pool.query(
            `INSERT INTO public."RequestDetails" ${details_columns} VALUES ${details_values}`
        );

        console.log("INSERT REQUEST DETAILS QUERY CALLED; Success Status: ", requestDetailsQuery.rowCount > 0);
        console.log("ALL EXECUTION COMPLETE")
        // Return the created request with details
        return {
            details: requestDetails
        };
    } catch (err) {
        console.error("Failed to apply for work-from-home:", err);
        throw err;
    }
};
