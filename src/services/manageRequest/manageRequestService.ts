import pool from "../../config/db";
// import { format, addDays, parseISO } from 'date-fns';


// Function to fetch pending requests
export const getPendingRequests = async (managerStaffId: string) => {
  try {
    const query = `
      SELECT 
          r.*,
          e."Staff_FName",
          e."Staff_LName",
          array_agg(rd."Date") as dates,
          array_agg(rd."WFH_Type") as wfh_types
      FROM public."Request" r
      INNER JOIN public."Employees" e ON r."Staff_ID" = e."Staff_ID"
      LEFT JOIN public."RequestDetails" rd ON r."Request_ID" = rd."Request_ID"
      WHERE r."Current_Status" = 'Pending'
      AND e."Reporting_Manager" = $1
      GROUP BY r."Request_ID", e."Staff_FName", e."Staff_LName";  
  `;

    const result = await pool.query(query, [managerStaffId]);
    const pendingRequests = result.rows;

    // Process the results to format the date range and WFH type
    const formattedRequests = pendingRequests.map((request) => {
      const sortedDates = request.dates.sort((a:Date, b:Date) => a.getTime() - b.getTime()); // Sort dates
      const dateRange = `${sortedDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${sortedDates[sortedDates.length - 1].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
      const wfhType = request.wfh_types[0]; 

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
