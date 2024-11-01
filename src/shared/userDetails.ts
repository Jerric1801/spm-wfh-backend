import pool from '../config/db';

/**
 * Queries the user's reporting manager based on their staff ID.
 * 
 * @param {number} staffId - The ID of the staff member.
 * @returns {Promise<{ reportingManager: string }>} - A promise that resolves to an object containing the reporting manager.
 */
const getUserDetails = async (staffId: number): Promise<{ reportingManager: string, position: string }> => {
  const query = `SELECT "Reporting_Manager", "Position" FROM public."Employees" WHERE "Staff_ID" = $1`;

  const result = await pool.query(query, [staffId]);

  if (result.rows.length === 0) {
    throw new Error(`Staff member with ID ${staffId} not found`);
  }

  const { Reporting_Manager: reportingManager, Position : position } = result.rows[0];
  console.log(reportingManager)
  return { reportingManager, position };
};

// Exporting the function as default
export default getUserDetails;
