import pool from "../../config/db";
import { format, addDays, parseISO } from "date-fns";
import { UserPayload } from "../auth/authService";
import getUserDetails from "../../shared/userDetails";

/**
 * Interface representing a staff member's details.
 */
interface StaffDetails {
  staffId: string;
  firstName: string;
  lastName: string;
  wfhType: string;
}

/**
 * Interface representing an employee's record from the database.
 */
interface EmployeeRecord {
  Staff_ID: string;
  Staff_FName: string;
  Staff_LName: string;
  Dept: string;
  Position: string;
}

/**
 * Interface representing a work-from-home request record from the database.
 */
interface WFHRequestRecord {
  Staff_ID: string;
  Date: string;
  WFH_Type: string;
}

/**
 * Fetches the schedule for employees within a specific date range, filtered by department and role.
 *
 * @param {string} startDate - The start date for the schedule (YYYY-MM-DD format).
 * @param {string} endDate - The end date for the schedule (YYYY-MM-DD format).
 * @param {UserPayload} [user] - An optional user object to filter employees by (e.g., for normal staff).
 * @param {string[]} [department] - An optional department name or an array of department names to filter employees by.
 * @param {string[]} [position] - An optional role name or an array of role names to filter employees by.
 * @returns {Promise<{ [date: string]: { [department: string]: { [role: string]: { [staffId: string]: StaffDetails } } } }>} - A promise that resolves to the schedule object.
 */
export const getSchedule = async (
  startDate: string,
  endDate: string,
  user?: UserPayload,
  departments?: string[],
  positions?: string[]
): Promise<{
  [date: string]: {
    [department: string]: {
      [role: string]: { [staffId: string]: StaffDetails };
    };
  };
}> => {
  const departmentArray = Array.isArray(departments)
    ? departments
    : departments
    ? [departments]
    : [];
  const positionArray = Array.isArray(positions)
    ? positions
    : positions
    ? [positions]
    : [];

  let employees: EmployeeRecord[];
  const { reportingManager, position } = await getUserDetails(user.Staff_ID);
  if (user.Role === "1") {
    // HR user, use department and role for filtering.
    console.log("User Role 1");
    employees = await getEmployees(undefined, departmentArray, positionArray);
  } else if (user.Role === "2") {
    // Role 2: Get employees under the same reporting manager AND same position, plus the reporting manager
    const peers = await getEmployees(reportingManager, undefined, [position]);
    const superior = await getEmployees(reportingManager);
    const uniqueEmployees = new Map<string, EmployeeRecord>();

    // Add peers and superior to a map to avoid duplicates
    peers.forEach((emp) => uniqueEmployees.set(emp.Staff_ID, emp));
    superior.forEach((emp) => uniqueEmployees.set(emp.Staff_ID, emp));

    employees = Array.from(uniqueEmployees.values());
  } else if (user.Role === "3") {
    // Role 3: Get all employees whose Reporting_Manager matches the user's Staff_ID (in string)
    // and all employees with the same Reporting_Manager as them
    console.log("User Role 3");
    const subordinates = await getEmployees(user.Staff_ID.toString());
    const peers = await getEmployees(reportingManager.toString());
    const uniqueEmployees = new Map<string, EmployeeRecord>();

    // Add subordinates and peers to a map to avoid duplicates
    subordinates.forEach((emp) => uniqueEmployees.set(emp.Staff_ID, emp));
    peers.forEach((emp) => uniqueEmployees.set(emp.Staff_ID, emp));

    employees = Array.from(uniqueEmployees.values());
  } else {
    // General case for other roles
    employees = await getEmployees(reportingManager);
  }

  const staffIds = employees.map((e) => e.Staff_ID);

  const wfhRequests: WFHRequestRecord[] = await getWFHRequests(
    startDate,
    endDate,
    staffIds
  );

  const schedule: {
    [date: string]: {
      [department: string]: {
        [role: string]: { [staffId: string]: StaffDetails };
      };
    };
  } = {};
  const allDates = getAllDatesInRange(startDate, endDate);

  employees.forEach((emp) => {
    const { Staff_ID, Staff_FName, Staff_LName, Dept, Position } = emp;

    const staff: StaffDetails = {
      staffId: Staff_ID,
      firstName: Staff_FName,
      lastName: Staff_LName,
      wfhType: "IN",
    };

    allDates.forEach((date) => {
      if (!schedule[date]) {
        schedule[date] = {};
      }

      if (!schedule[date][Dept]) {
        schedule[date][Dept] = {};
      }

      if (!schedule[date][Dept][Position]) {
        schedule[date][Dept][Position] = {};
      }

      schedule[date][Dept][Position][Staff_ID] = staff;
    });
  });

  wfhRequests.forEach((request) => {
    const { Staff_ID, Date, WFH_Type } = request;
    const formattedDate = format(parseISO(Date), "yyyy-MM-dd");

    employees.forEach((emp) => {
      if (
        emp.Staff_ID === Staff_ID &&
        schedule[formattedDate]?.[emp.Dept]?.[emp.Position]?.[Staff_ID]
      ) {
        schedule[formattedDate][emp.Dept][emp.Position][Staff_ID].wfhType =
          WFH_Type;
      }
    });
  });

  return schedule;
};

/**
 * Helper function to get all dates in a specified range.
 * @param {string} start - The start date.
 * @param {string} end - The end date.
 * @returns {string[]} - An array of all dates in the range.
 */
function getAllDatesInRange(start: string, end: string): string[] {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const dates = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(format(currentDate, "yyyy-MM-dd"));
    currentDate = addDays(currentDate, 1);
  }

  return dates;
}

/**
 * Helper function to build the WHERE clause for SQL queries based on department, reporting manager, and role.
 *
 * @param {string[]} [departmentArray=[]] - An optional array of department names.
 * @param {string} [reportingManager] - An optional reporting manager name or ID.
 * @param {string[]} [positionArray=[]] - An optional array of role names.
 * @returns {{ conditions: string, whereParams: (string | number | string[])[] }} - The SQL conditions and query parameters.
 */
function buildWhereClause(
  reportingManager: string | undefined,
  departmentArray: string[] = [],
  positionArray: string[] = []
): { conditions: string; whereParams: (string | number | string[])[] } {
  const conditions: string[] = [];
  const whereParams: (string | number | string[])[] = [];

  console.log(departmentArray, positionArray);

  // Add reporting manager condition if reportingManager is provided
  if (reportingManager !== undefined) {
    conditions.push(
      `e."Reporting_Manager" = $${whereParams.length + 1} OR e."Staff_ID" = $${
        whereParams.length + 2
      }`
    );
    whereParams.push(reportingManager, Number(reportingManager));
  }

  // Add department condition if departmentArray is provided
  if (departmentArray && departmentArray.length > 0) {
    conditions.push(`e."Dept" = ANY($${whereParams.length + 1}::text[])`);
    whereParams.push(departmentArray);
  }

  // Add role condition if positionArray is provided
  if (positionArray && positionArray.length > 0) {
    conditions.push(`e."Position" = ANY($${whereParams.length + 1}::text[])`);
    whereParams.push(positionArray);
  }

  return { conditions: conditions.join(" AND "), whereParams };
}

/**
 * Fetches employees based on department and reporting manager filters.
 *
 *
 * @param {string[]} [departmentArray=[]] - An optional array of department names to filter by.
 * @param {string[]} [reportingManager] - A reporting manager name or ID.
 * @returns {Promise<EmployeeRecord[]>} - A promise that resolves to an array of employee records.
 */
async function getEmployees(
  reportingManager: string,
  departmentArray?: string[],
  positionArray?: string[]
): Promise<EmployeeRecord[]> {
  console.log(departmentArray, positionArray);
  const { conditions, whereParams } = buildWhereClause(
    reportingManager,
    departmentArray,
    positionArray
  );
  let query = `
    SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
    FROM public."Employees" e

  `;

  if (conditions) {
    query += ` WHERE ${conditions}`;
  }
  console.log(query);
  const result = await pool.query(query, whereParams);
  return result.rows;
}

/**
 * Fetches work-from-home (WFH) requests based on the date range, staff IDs, department, and reporting manager.
 *
 * @param {string} startDate - The start date for the WFH requests (in YYYY-MM-DD format).
 * @param {string} endDate - The end date for the WFH requests (in YYYY-MM-DD format).
 * @param {string[]} staffIds - An array of staff IDs.
 * @returns {Promise<WFHRequestRecord[]>} - A promise that resolves to an array of WFH request records.
 */
async function getWFHRequests(
  startDate: string,
  endDate: string,
  staffIds: string[]
): Promise<WFHRequestRecord[]> {
  const params = [startDate, endDate, staffIds];

  const query = `
    SELECT e."Staff_ID", rd."Date", COALESCE(rd."WFH_Type", 'IN') AS "WFH_Type"
    FROM public."Employees" e
    INNER JOIN public."Request" r ON e."Staff_ID" = r."Staff_ID" AND r."Current_Status" = 'Approved'
    INNER JOIN public."RequestDetails" rd ON r."Request_ID" = rd."Request_ID" AND rd."Date" BETWEEN $1 AND $2
    WHERE e."Staff_ID" = ANY($3::int[])
  `;

  console.log(query);
  const result = await pool.query(query, params);
  return result.rows;
}
