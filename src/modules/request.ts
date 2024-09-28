import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
function createDBClient() {
    return new Client({
      user: process.env.DB_USER,
      host: 'localhost',// changed to localhost from DB_HOST, not sure if changing the env file will cos any issues :(
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT),
    });
  }
async function connectDB(client: Client) {
    try {
      await client.connect();
      console.log('Connected to the database');
    } catch (err) {
      console.error('Error connecting to the database', err);
    }
  }

  // mehtod to get all employee working status regardless of approval
  async function fetchRequestsByDate(date: string) {
    const client = createDBClient();
    
    try {
      await connectDB(client);
      
      // Use parameterized query to avoid SQL injection
      const query = `
       SELECT * FROM public."Request"
        WHERE "Created_At" = $1
        ORDER BY "Request_ID" ASC;
      `;
      
      const res = await client.query(query, [date]);
      console.log(res.rows);
    } catch (err) {
      console.error('Error querying the database', err);
    } finally {
      await client.end();
    }
  }
  //method to get employees who have apporved WFH on the certain date
async function fetchRequestsByDateApproved(date: string) {
    const client = createDBClient();
    
    try {
      await connectDB(client);
      
      // Use parameterized query to avoid SQL injection
      const query = `
        SELECT r.*,w."WFH_StartDate", w."WFH_EndDate", w."Type_WFH"
        FROM public."Request" r
        LEFT JOIN public."RequestDetails" w
        ON r."Request_ID" = w."Request_ID"
        WHERE w."WFH_StartDate" = $1
        AND r."Current_Status" = 'Approved'
        ORDER BY r."Request_ID" ASC;
      `;
      
      const res = await client.query(query, [date]);
      console.log(res.rows);
    } catch (err) {
      console.error('Error querying the database', err);
    } finally {
      await client.end();
    }
  }
//method to get employees who have approved WFH based on DEPT on the certain date


  async function fetchRequestsByDeptDate(dept:string ,date: string,status:string) {
    const client = createDBClient();
    
    try {
      await connectDB(client);
      
      // Use parameterized query to avoid SQL injection
      const query = `
        SELECT r.*,w."WFH_StartDate", w."WFH_EndDate", w."Type_WFH"
        FROM public."Request" r
        LEFT JOIN public."RequestDetails" w
        ON r."Request_ID" = w."Request_ID"
        WHERE r."Dept" = $1
        AND w."WFH_StartDate" = $2
        AND r."Current_Status" = $3
        ORDER BY r."Request_ID" ASC;
        `;
      
      const res = await client.query(query, [dept,date,status]);
      console.log(res.rows);
    } catch (err) {
      console.error('Error querying the database', err);
    } finally {
      await client.end();
    }
  }

//fetch request by WFH type, status, date
  async function fetchRequestsByWFHDetails(typeWFH: string, currentStatus: string, wfhStartDate: string) {
    const client = createDBClient();
  
    try {
      await connectDB(client);
      const query = `
        SELECT r."Request_ID", r."Staff_ID", r."Dept", r."Current_Status", r."Created_At", 
               w."WFH_StartDate", w."WFH_EndDate", w."Type_WFH"
        FROM public."Request" r
        JOIN public."RequestDetails" w
        ON r."Request_ID" = w."Request_ID"
        WHERE w."Type_WFH" = $1
          AND r."Current_Status" = $2
          AND w."WFH_StartDate" = $3
        ORDER BY r."Request_ID" ASC;
      `;
  
      // Execute the query with the parameters
      const res = await client.query(query, [typeWFH, currentStatus, wfhStartDate]);
      console.log(res.rows); // Output the result
    } catch (err) {
      console.error('Error querying the database', err);
    } finally {
      await client.end(); // Close the database connection
    }
  }

  // provides those who are working from home by filtering out those who do not have any wfh request or wfh request rejected or pending
  async function fetchEmployeesWFOByDate(wfhStartDate: string) {
    const client = createDBClient();
  
    try {
      await connectDB(client);
      
      const query = `
       SELECT e.*
      FROM public."Employees" e
      LEFT JOIN public."Request" r
      ON e."Staff_ID" = r."Staff_ID"
      LEFT JOIN public."RequestDetails" w
      ON r."Request_ID" = w."Request_ID"
      AND r."Current_Status" = 'Approved'
      AND w."WFH_StartDate" = $1
      WHERE w."WFH_StartDate" IS NULL;
      `;
      
      const res = await client.query(query, [wfhStartDate]);  // Pass date as parameter
      console.log(res.rows);
    } catch (err) {
      console.error('Error querying the database', err);
    } finally {
      await client.end();
    }
  }
  
  // Example usage:
//   fetchEmployeesWFOByDate('2024-10-01');
  

//test
//   fetchRequestsByDate('2024-11-06')
//   fetchRequestsByDateApproved('2024-08-08');
//   fetchRequestsByDeptDate('Engineering','2024-08-08', 'Approved')
//   fetchRequestsByWFHDetails('AM', 'Approved', '2024-12-21');


//npx ts-node src/modules/request.ts