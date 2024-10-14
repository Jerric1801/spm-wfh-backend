import pool from "../../config/db";
import { format, addDays, parseISO } from 'date-fns';


// Function to fetch pending requests
export const getPendingRequests = async () => {
    try {
      // SQL query to fetch all requests with "Pending" status
      const query = `
        SELECT * FROM public."Request"
        WHERE "Current_Status" = 'Pending' 
      `;
  
      const result = await pool.query(query);
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
      const query = `
        UPDATE public."Request"
        SET "Current_Status" = 'Approved', "Last_Updated" = NOW()
        WHERE "Request_ID" = $1 AND "Current_Status" = 'Pending'
      `;
  
      const params = [requestId];
      const result = await pool.query(query, params);
  
      if (result.rowCount > 0) {
        console.log(`Request ${requestId} approved successfully.`);
        return { message: "Request approved successfully." };
      } else {
        return { message: "Request not found or already processed." };
      }
    } catch (error) {
      console.error("Error approving request:", error);
      throw error;
    }
  };

  export const rejectRequest = async (requestId: number ) => {
    try {
      const query = `
        UPDATE public."Request"
        SET "Current_Status" = 'Rejected', "Last_Updated" = NOW()
        WHERE "Request_ID" = $1 AND "Current_Status" = 'Pending'
      `;
  
      const params = [requestId];
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
