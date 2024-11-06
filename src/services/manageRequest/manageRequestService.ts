import pool from "../../config/db";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import awsConfig from "../../config/aws";
import { sendEmail } from "../../shared/sendEmail";

const getRecurringDates = (dates: Date[]): string[] => {
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]; // Corrected order
  const recurringDays: string[] = [];

  // Create a set to store unique days of the week (in UTC)
  const uniqueDays = new Set(
    dates.map((date) => {
      const dateUTC = new Date(date); // No need to convert if already in UTC
      return daysOfWeek[dateUTC.getUTCDay()];
    })
  );

  // If there are more than 2 unique days, it's likely recurring
  if (uniqueDays.size > 1) {
    uniqueDays.forEach((day) => recurringDays.push(day));
  }

  return recurringDays;
};

// Function to fetch pending requests
const getDocumentFromS3 = async (key: string): Promise<string> => {
  const s3Client = new S3Client({
    region: awsConfig.region,
    credentials: {
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
    },
  });

  const params = {
    Bucket: awsConfig.bucketName,
    Key: key,
  };

  try {
    // For private files, generate a pre-signed URL
    const command = new GetObjectCommand(params);
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900,
    }); // URL expires in 15 minutes

    return presignedUrl;
  } catch (error) {
    console.error("Error fetching document from S3:", error);
    throw error;
  }
};

export const getPendingRequests = async (managerStaffId: string) => {
  try {
    // SQL query to fetch requests
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

    // Process the results and fetch documents from S3
    const formattedRequests = await Promise.all(
      pendingRequests.map(async (request) => {
        let documentUrls = [];

        // Check if request.Document exists and is an array
        if (Array.isArray(request.Document) && request.Document.length > 0) {
          const documentPromises = request.Document.map(getDocumentFromS3);
          documentUrls = await Promise.all(documentPromises);
        }

        // Sort the dates and get the date range
        const sortedDates = (request.dates || []).sort(
          (a: Date, b: Date) => a.getTime() - b.getTime()
        );
        const dateRange =
          sortedDates.length > 0
            ? `${sortedDates[0].toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })} - ${sortedDates[sortedDates.length - 1].toLocaleDateString(
                "en-GB",
                { day: "numeric", month: "short" }
              )}`
            : "";

        // Get the WFH type
        const wfhType =
          Array.isArray(request.wfh_types) && request.wfh_types.length > 0
            ? request.wfh_types[0]
            : undefined;

        // Calculate recurring dates
        const recurringDates = getRecurringDates(request.dates);

        return {
          key: request.Request_ID.toString(),
          id: request.Staff_ID,
          member: `${request.Staff_FName} ${request.Staff_LName}`,
          dateRange: dateRange,
          wfhType: wfhType,
          reason: request.Request_Reason,
          document: documentUrls,
          recurringDates: recurringDates, // Include recurring dates in the response
        };
      })
    );

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
      SET "Current_Status" = 'Approved', "Last_Updated" = NOW(), "User_Seen" = $2, "Manager_Seen" = $3
      WHERE "Request_ID" = $1 AND "Current_Status" = 'Pending'
    `;

    const params = [requestId, false, true];
    const result = await pool.query(query, params);

    console.log("Rows affected:", result.rowCount); // Log rowCount

        // Query to get the employee's First Name, Last Name, and Email by joining Request and Employees tables
        const employeeDetailsQuery = `
        SELECT e."Staff_FName", e."Staff_LName", e."Email" 
        FROM public."Request" r
        JOIN public."Employees" e ON r."Staff_ID" = e."Staff_ID"
        WHERE r."Request_ID" = $1`;
  
      const employeeDetailsQueryResults = await pool.query(employeeDetailsQuery, [requestId,]);
  
      // Extract the employee's details
      const employeeFirstName = employeeDetailsQueryResults.rows[0].Staff_FName;
      const employeeLastName = employeeDetailsQueryResults.rows[0].Staff_LName;
      const employeeEmail = employeeDetailsQueryResults.rows[0].Email;
  
      // Define the user object to be used in sendEmail function
      const user = {Staff_FName: employeeFirstName, Staff_LName: employeeLastName, Email: employeeEmail};
  
      // Send the email with managerAction set to false
      await sendEmail({
        user,
        currentStatus: "Approved",
        requestId,
        managerAction: false,
      });

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

export const rejectRequest = async (
  requestId: number,
  managerReason: string
) => {
  try {
    const query = `
      UPDATE public."Request"
      SET "Current_Status" = 'Rejected', "Last_Updated" = NOW(), "Manager_Reason" = $2, "User_Seen" = $3, "Manager_Seen" = $4
      WHERE "Request_ID" = $1 AND "Current_Status" = 'Pending'
    `;

    const params = [requestId, managerReason, false, true];
    const result = await pool.query(query, params);

    // Query to get the employee's First Name, Last Name, and Email by joining Request and Employees tables
    const employeeDetailsQuery = `
        SELECT e."Staff_FName", e."Staff_LName", e."Email" 
        FROM public."Request" r
        JOIN public."Employees" e ON r."Staff_ID" = e."Staff_ID"
        WHERE r."Request_ID" = $1`;

    const employeeDetailsQueryResults = await pool.query(employeeDetailsQuery, [
      requestId,
    ]);

    // Extract the employee's details
    const employeeFirstName = employeeDetailsQueryResults.rows[0].Staff_FName;
    const employeeLastName = employeeDetailsQueryResults.rows[0].Staff_LName;
    const employeeEmail = employeeDetailsQueryResults.rows[0].Email;

    // Define the user object to be used in sendEmail function
    const user = {
      Staff_FName: employeeFirstName,
      Staff_LName: employeeLastName,
      Email: employeeEmail,
    };

    // Send the email with managerAction set to false
    await sendEmail({
      user,
      currentStatus: "Rejected",
      requestId,
      managerAction: false,
    });

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
            rd."WFH_Type",  
            r."Current_Status", 
            r."Request_Reason",
            r."Document",
            array_agg(rd."Date") as dates 
        FROM 
            public."Request" r
        INNER JOIN 
            public."RequestDetails" rd
        ON 
            r."Request_ID" = rd."Request_ID"  
        WHERE 
            r."Staff_ID" = $1 
        GROUP BY 
            r."Request_ID", rd."WFH_Type", r."Current_Status", r."Request_Reason" 
        ORDER BY 
            r."Request_ID"
    `;

    const result = await pool.query(query, [staffID]);
    const rows = result.rows;

    // Consolidate by Request_ID, calculate recurring dates, and fetch documents
    const consolidatedRequests = await Promise.all(
      rows.map(async (row) => {
        const sortedDates = (row.dates || []).sort(
          (a: Date, b: Date) => a.getTime() - b.getTime()
        );
        console.log(sortedDates);
        // Calculate recurring dates
        const recurringDates = getRecurringDates(sortedDates);
        console.log("rec dates:", recurringDates);
        // Fetch documents from S3
        let documentUrls = [];
        if (Array.isArray(row.Document) && row.Document.length > 0) {
          const documentPromises = row.Document.map(getDocumentFromS3);
          documentUrls = await Promise.all(documentPromises);
        }

        return {
          Request_ID: row.Request_ID,
          Start_Date: row.dates[0],
          End_Date: row.dates[row.dates.length - 1],
          WFH_Type: row.WFH_Type,
          Current_Status: row.Current_Status,
          Request_Reason: row.Request_Reason,
          Recurring_Dates: recurringDates,
          Documents: documentUrls, // Include document URLs in the result
        };
      })
    );

    // Return consolidated requests as an array
    return consolidatedRequests;
  } catch (error) {
    console.error("Error fetching staff requests:", error);
    throw error;
  }
};

export const withdrawRequestService = async (
  requestId: number,
  staffId: string,
  requestReason: string
) => {
  try {
    const query = `
          UPDATE public."Request"
          SET "Current_Status" = 'Withdrawn', "Last_Updated" = NOW(), "Request_Reason" = $3, "User_Seen" = $4, "Manager_Seen" = $5
          WHERE "Request_ID" = $1 AND "Staff_ID" = $2
      `;

    const params = [requestId, staffId, requestReason, true, false];
    const result = await pool.query(query, params);

    // First query to get the Reporting_Manager value (as a string) for the specific Staff_ID
    const reportingManagerQuery = `SELECT "Reporting_Manager" FROM public."Employees" WHERE "Staff_ID" = $1`;
    const reportingManagerQueryResults = await pool.query(
      reportingManagerQuery,
      [staffId]
    );

    // Convert the Reporting_Manager identifier to an integer
    const reportingManagerIdentifier = parseInt(
      reportingManagerQueryResults.rows[0].Reporting_Manager,
      10
    );

    // Step 2: Use the Reporting_Manager identifier to get the manager's details
    const managerDetailsQuery = `
        SELECT "Staff_FName", "Staff_LName", "Email" 
        FROM public."Employees" 
        WHERE "Staff_ID" = $1
    `;

    const managerDetailsQueryResults = await pool.query(managerDetailsQuery, [
      reportingManagerIdentifier,
    ]);

    // Extract the manager's details
    const managerFirstName = managerDetailsQueryResults.rows[0].Staff_FName;
    const managerLastName = managerDetailsQueryResults.rows[0].Staff_LName;
    const managerEmail = managerDetailsQueryResults.rows[0].Email;

    // Define the user object to be used in sendEmail function
    const user = {
      Staff_FName: managerFirstName,
      Staff_LName: managerLastName,
      Email: managerEmail, // Directly use manager's email
    };
    // Send
    sendEmail({
      user,
      currentStatus: "Withdrawn",
      requestId,
      managerAction: false,
    });

    return result; // Return the result to check row count in controller
  } catch (error) {
    console.error("Error withdrawing request:", error);
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
