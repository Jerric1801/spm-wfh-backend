import { Pool } from 'pg';

// Set up the database connection pool
const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'spm',
  password: 'admin',
  port: 5432, // Default PostgreSQL port
});

// Function to get all data from the 'Request' table
export const getAllRequests = async (): Promise<void> => {
    try {
      // Query to fetch all rows from the 'Request' table
      const result = await pool.query('SELECT * FROM public."Request";');
      
      // Log the number of rows fetched
      console.log(`Fetched ${result.rowCount} entries from the Request table.`);
      
      // Log each row from the result
      result.rows.forEach((row, index) => {
        console.log(`Entry ${index + 1}:`, row);
      });
    } catch (error) {
      console.error('Error fetching data from Request table:', error);
    }
  };
  
  // Example usage
  getAllRequests().catch((err) => {
    console.error(err);
  });