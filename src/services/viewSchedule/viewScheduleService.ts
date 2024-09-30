import pool from "../../config/db";

// Service to get schedule by department or the entire organization if department is undefined
export const getScheduleByDepartment = async (
  startDate: string,
  endDate: string,
  department?: string
) => {
  try {
    let query = `
      SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", r."Request_ID", e."Dept", rd."Date", rd."WFH_Type" 
      FROM public."Employees" e
      INNER JOIN public."Request" r ON e."Staff_ID" = r."Staff_ID"
      INNER JOIN public."RequestDetails" rd ON r."Request_ID" = rd."Request_ID"
      WHERE r."Current_Status" = 'Approved' AND rd."Date" BETWEEN $1 AND $2;
            `;

    const params: string[] = [startDate, endDate];

    if (department) {
      query += ` AND public.e."Dept" = $3`;
      params.push(department);
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    throw new Error("Database query failed: " + err.message);
  }
};

// Service to get schedule by team within a specific department or entire department if team is undefined
export const getScheduleByTeam = async (
  startDate: string,
  endDate: string,
  department: string,
  team?: string
) => {
  try {
    let query = `
        SELECT e."Staff_ID", e."Staff_FName", e."Dept", e."Position", rd."Date", rd."WFH_Type"
        FROM public."Employee" e
        INNER JOIN public."Request" r ON e."Staff_ID" = r."Staff_ID"
        INNER JOIN public."RequestDetails" rd ON r."Request_ID" = rd."Request_ID"
        WHERE r."Status" = 'Approved' AND e."Dept" = $1 AND rd."Date" BETWEEN $2 AND $3;
    `;

    const params: string[] = [department, startDate, endDate];

    if (team) {
      query += ` AND public.'Employee'.Position = $4`;
      params.push(team);
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    throw new Error("Database query failed: " + err.message);
  }
};
