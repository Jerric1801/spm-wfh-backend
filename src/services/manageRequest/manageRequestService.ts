import pool from "../../config/db";
// import { format, addDays, parseISO } from 'date-fns';


// Function to fetch pending requests
export const getPendingRequests = async (managerStaffId: string) => {
  try {
      // SQL query to fetch requests where the reporting manager is the current user's staff ID status is pending
      const query = `
          SELECT r.*
          FROM public."Request" r
          INNER JOIN public."Employees" e ON r."Staff_ID" = e."Staff_ID"
          WHERE r."Current_Status" = 'Pending'
          AND e."Reporting_Manager" = $1
      `;

    const result = await pool.query(query, [managerStaffId]);
    const pendingRequests = result.rows;

    // Process the results to format the date range and WFH type
    const formattedRequests = pendingRequests.map((request) => {
      const sortedDates = (request.dates || []).sort((a:Date, b:Date) => a.getTime() - b.getTime()); // Sort dates or an empty array
      const dateRange = sortedDates.length > 0 
        ? `${sortedDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${sortedDates[sortedDates.length - 1].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
        : ''; // Set to empty string if no dates
      const wfhType = request.wfh_types.length > 0 ? request.wfh_types[0] : undefined; 

      return {
        key: request.Request_ID.toString(), 
        id: request.Staff_ID,
        member: `${request.Staff_FName} ${request.Staff_LName}`, 
        dateRange: dateRange,
        wfhType: wfhType,
        reason: request.Request_Reason, 
      };
    });

    return formattedRequests;
  } catch (error) {
      console.error("Error fetching pending requests:", error);
      throw error;
  }
};

export const getRequests = async (managerStaffId: string) => {
  try {
      // SQL query to fetch requests where the reporting manager is the current user's staff ID regardless of status
      const query = `
          SELECT r.*
          FROM public."Request" r
          INNER JOIN public."Employees" e ON r."Staff_ID" = e."Staff_ID"
          WHERE e."Reporting_Manager" = $1
      `;

      const result = await pool.query(query, [managerStaffId]);
      const requests = result.rows;

      // Return pending requests as an array
      return requests;
  } catch (error) {
      console.error("Error fetching requests:", error);
      throw error;
  }
};

export const approveRequest = async (requestId: number) => {
  try {
    console.log("Approving request with ID:", requestId); // Log the request ID
    const query = `
      UPDATE public."Request"
      SET "Current_Status" = 'Approved', "Last_Updated" = NOW()
      WHERE "Request_ID" = $1 AND "Current_Status" = 'Pending'
    `;

    const params = [requestId];
    const result = await pool.query(query, params);
    
    console.log("Rows affected:", result.rowCount); // Log rowCount

    if (result.rowCount > 0) {
      console.log(`Request ${requestId} approved successfully.`);
      return { message: "Request approved successfully." };
    } else {
      return { message: "Request not found or already processed."};
    }
  } catch (error) {
    console.error("Error approving request:", error);
    throw error;
  }
};

export const rejectRequest = async (requestId: number, managerReason: string) => {
  try {
    const query = `
      UPDATE public."Request"
      SET "Current_Status" = 'Rejected', "Last_Updated" = NOW(), "Manager_Reason" = $2
      WHERE "Request_ID" = $1 AND "Current_Status" = 'Pending'
    `;

    const params = [requestId, managerReason];
    const result = await pool.query(query, params);

    if (result.rowCount > 0) {
      console.log(`Request ${requestId} rejected successfully.`);
      return { message: "Request rejected successfully." };
    } else {
      return { message: "Request not found or already processed." };
    }
  } catch (error) {
    console.error("Error rejecting request:", error);
    throw error;
  }
};

export const getStaffRequests = async (staffID: string) => {
  try {
    // SQL query to fetch requests for a specific staff ID, including request details
    const query = `
        SELECT 
            r."Request_ID",        
            rd."Date" AS "Date",   
            rd."WFH_Type",  
            r."Current_Status", 
            r."Request_Reason"   
        FROM 
            public."Request" r
        INNER JOIN 
            public."RequestDetails" rd
        ON 
            r."Request_ID" = rd."Request_ID"  
        WHERE 
            r."Staff_ID" = $1 
        ORDER BY 
            r."Request_ID", rd."Date" ASC
    `;

    const result = await pool.query(query, [staffID]);
    const rows = result.rows;

    // Consolidate by Request_ID
    const consolidatedRequests = rows.reduce((acc: any[], row) => {
        const existingRequest = acc.find(r => r.Request_ID === row.Request_ID);

        if (existingRequest) {
            // Update the End_Date if the current row's Date is later
            existingRequest.End_Date = row.Date;
        } else {
            // Add new entry for a unique Request_ID with Start_Date and End_Date initialized to the same date
            acc.push({
                Request_ID: row.Request_ID,
                Start_Date: row.Date,
                End_Date: row.Date,
                WFH_Type: row.WFH_Type,
                Current_Status: row.Current_Status,
                Request_Reason: row.Request_Reason
            });
        }

        return acc;
    }, []);

    // Return consolidated requests as an array
    return consolidatedRequests;
  } catch (error) {
      console.error("Error fetching staff requests:", error);
      throw error;
  }
};


export const withdrawRequestService = async (requestId: number, staffId: string, requestReason: string) => {
  try {
      const query = `
          UPDATE public."Request"
          SET "Current_Status" = 'Withdrawn', "Last_Updated" = NOW(), "Request_Reason" = $3
          WHERE "Request_ID" = $1 AND "Staff_ID" = $2
      `;

      const params = [requestId, staffId, requestReason];
      const result = await pool.query(query, params);

      return result; // Return the result to check row count in controller
  } catch (error) {
      console.error('Error withdrawing request:', error);
      throw error;
  }
};

export const getPendingRequestCount = async (managerStaffId: string) => {
  try {
      const query = `
          SELECT COUNT(*) AS pending_count
          FROM public."Request" r
          INNER JOIN public."Employees" e ON r."Staff_ID" = e."Staff_ID"
          WHERE r."Current_Status" = 'Pending'
          AND e."Reporting_Manager" = $1
      `;

      const result = await pool.query(query, [managerStaffId]);
      const pendingCount = result.rows[0].pending_count;

      return parseInt(pendingCount, 10); // Convert to an integer
  } catch (error) {
      console.error("Error fetching pending request count:", error);
      throw error;
  }
};