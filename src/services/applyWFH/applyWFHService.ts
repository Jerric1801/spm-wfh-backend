// src/services/applyWFH/applyWFHService.ts
import pool from "../../config/db";
import { format } from "date-fns";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import awsConfig from "../../config/aws";
import mime from "mime-types";
import { sendEmail } from "../../shared/sendEmail";

interface WorkFromHomeRequest {
  Staff_ID: number;
  Dates: Date[];
  WFHType: "AM" | "PM" | "WD";
  WFHReason: string;
  Document?: string[]; // Array of base64 strings
}

interface S3UploadParams {
  Bucket: string;
  Key: string;
  ContentType: string;
  Body: Buffer;
}

// Helper function to check for conflicting request dates
async function checkForConflicts(
  dates: string[],
  staffId: number
): Promise<boolean> {
  console.log(dates);
  const currentRequestIdsResult = await pool.query(
    `
        SELECT "Request_ID" FROM public."Request" WHERE "Staff_ID" = $1
    `,
    [staffId]
  );

  if (!currentRequestIdsResult.rows) {
    return false;
  }

  const requestIds = currentRequestIdsResult.rows.map((row) => row.Request_ID);

  const conflictsResult = await pool.query(
    `
        SELECT rd."Date" 
        FROM public."RequestDetails" rd
        JOIN public."Request" r ON rd."Request_ID" = r."Request_ID"
        WHERE rd."Request_ID" = ANY($1) 
          AND rd."Date" = ANY($2) 
          AND r."Current_Status" != 'Withdrawn'
    `,
    [requestIds, dates]
  );

  return conflictsResult.rowCount > 0;
}

export const handleDocumentUpload = async (
  base64Data: string
): Promise<string> => {
  const s3Client = new S3Client({
    region: awsConfig.region,
    credentials: {
      accessKeyId: awsConfig.accessKeyId,
      secretAccessKey: awsConfig.secretAccessKey,
    },
  });
  console.log("B64", base64Data);
  // Extract the file type from the base64 string
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    console.error("Invalid base64 string:", base64Data); // Log the invalid base64 string
    throw new Error("Invalid base64 string format");
  }

  const fileType = matches[1];
  const fileBuffer = Buffer.from(matches[2], "base64");

  const fileExtension = mime.extension(fileType) || "txt";
  const fileName = `reasons/${Date.now()}_${Math.random()
    .toString(36)
    .substring(2)}.${fileExtension}`;

  const params: S3UploadParams = {
    Bucket: awsConfig.bucketName,
    Key: fileName,
    ContentType: fileType,
    Body: fileBuffer, // Store the file content directly
  };

  const command = new PutObjectCommand(params);

  try {
    const uploadResult = await s3Client.send(command);
    console.log("File uploaded successfully:", uploadResult);

    // Generate a pre-signed URL for accessing the uploaded file (optional)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900,
    });
    return fileName; // Return the file name stored in S3
  } catch (err) {
    console.error("Error uploading file:", err);
    throw new Error(`Failed to upload document to S3.`);
  }
};

// Main Function
export const applyForWorkFromHome = async (request: WorkFromHomeRequest) => {
  try {
    // --- Call handleDocumentUpload for each document ---
    console.log("reached service");
    if (request.Document) {
      const uploadPromises = request.Document.map(handleDocumentUpload);
      const uploadedDocumentUrls = await Promise.all(uploadPromises);
      // --- Update the request object with the document URLs ---
      request.Document = uploadedDocumentUrls; // Update the Document property directly
    } else {
      request.Document = [];
    }

    // Check for conflicting request dates
    const formattedDates = request.Dates.map((date) =>
      format(date, "yyyy-MM-dd")
    );
    const conflicts = await checkForConflicts(formattedDates, request.Staff_ID);
    if (conflicts) {
      throw new Error("Conflicting request dates found.");
    }

    // Ensure sequence is correct
    await pool.query(`
            ALTER TABLE public."Request"
            ALTER COLUMN "Request_ID" SET DEFAULT nextval('public."Request_Request_ID_seq"')
        `);

    await pool.query(`
            SELECT setval('public."Request_Request_ID_seq"', (SELECT MAX("Request_ID") FROM public."Request"))
        `);

    // Generate a unique Request_ID
    const requestIdQuery = await pool.query(
      'SELECT nextval(\'public."Request_Request_ID_seq"\') AS "Request_ID"'
    );

    // Extract the Request_ID
    const requestId = requestIdQuery.rows[0].Request_ID;

    // Insert the request into the Request table (include Document URLs)
    const requestQuery = await pool.query(
      'INSERT INTO public."Request" ("Request_ID", "Staff_ID", "Current_Status", "Created_At", "Last_Updated", "Request_Reason", "Manager_Reason", "Document", "User_Seen", "Manager_Seen") VALUES ($1, $2, $3, NOW(), NOW(), $4, $5, $6, $7, $8)',
      [
        requestId,
        request.Staff_ID,
        "Pending",
        request.WFHReason,
        "",
        request.Document,
        true,
        false,
      ]
    );

    // Insert the work-from-home details into the RequestDetails table
    console.log(request.Dates);
    const requestDetails = request.Dates.map((date) => ({
      Request_ID: requestId,
      Date: format(date, "yyyy-MM-dd"), // Format the date
      WFH_Type: request.WFHType,
    }));

    const details_columns = '("Request_ID", "Date", "WFH_Type")';
    const details_values = requestDetails
      .map((rd) => `(${rd.Request_ID}, '${rd.Date}', '${rd.WFH_Type}')`)
      .join(", ");

    // First query to get the Reporting_Manager value (as a string) for the specific Staff_ID
    const reportingManagerQuery = `SELECT "Reporting_Manager" FROM public."Employees" WHERE "Staff_ID" = $1`;
    const reportingManagerQueryResults = await pool.query(reportingManagerQuery, [request.Staff_ID]);

    // Convert the Reporting_Manager identifier to an integer
    const reportingManagerIdentifier = parseInt(reportingManagerQueryResults.rows[0].Reporting_Manager, 10);

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
      currentStatus: "Pending",
      requestId,
      managerAction: true,
    });

    // Return the created request with details (you might want to include document URLs here)
    return {
      details: requestDetails,
    };
  } catch (err) {
    console.error("Failed to apply for work-from-home:", err);
    throw err;
  }
};
