import pool from "../../config/db";
// import { format, addDays, parseISO } from 'date-fns';


// Function to fetch pending requests
export const getPendingRequests = async (managerStaffId: string) => {
  try {
      // SQL query to fetch requests where the reporting manager is the current user's staff ID
      const query = `
          SELECT r.*
          FROM public."Request" r
          INNER JOIN public."Employees" e ON r."Staff_ID" = e."Staff_ID"
          WHERE r."Current_Status" = 'Pending'
          AND e."Reporting_Manager" = $1
      `;

      const result = await pool.query(query, [managerStaffId]);
      const pendingRequests = result.rows;

      // Return pending requests as an array
      return pendingRequests;
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
  if (!managerReason) {
    throw new Error("Manager reason must be provided.");
  }
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
