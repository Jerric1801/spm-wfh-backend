import pool from "../../config/db";
import { format, addDays, parseISO } from 'date-fns';

interface StaffDetails {
  Staff_FName: string;
  Staff_LName: string;
  WFH_Type: string;
}

interface TeamDetails {
  [staffId: string]: StaffDetails;
}

interface DepartmentDetails {
  [team: string]: TeamDetails;
}

interface ScheduleDetails {
  [department: string]: DepartmentDetails;
}

interface FullSchedule {
  [date: string]: ScheduleDetails;
}

// Helper function to generate all dates between two dates
function getAllDatesInRange(start: string, end: string): string[] {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  const dates = [];
  let currentDate = startDate;

  while (currentDate <= endDate) {
    dates.push(format(currentDate, 'yyyy-MM-dd')); // Format as string
    currentDate = addDays(currentDate, 1); // Add one day
  }

  return dates;
}

export const getSchedule = async (
  startDate: string,
  endDate: string,
  department?: string[] | string,
  team?: string[] | string
) => {
  try {
    // Ensure `department` and `team` are arrays, even if there's only a single entry
    const departmentArray = Array.isArray(department) ? department : department ? [department] : [];
    const teamArray = Array.isArray(team) ? team : team ? [team] : [];

    // Convert department and team arrays to strings for use in SQL query
    const departmentString = departmentArray.length > 0 ? departmentArray.map(d => `'${d}'`).join(", ") : '';
    const teamString = teamArray.length > 0 ? teamArray.map(t => `'${t}'`).join(", ") : '';

    // Query 1: Get all employees based on department and team filters
    let employeesQuery = `
      SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
      FROM public."Employees" e
    `;

    // Dynamically add clauses if department and team filters are provided for employees query
    const employeeWhereConditions = [];
    if (departmentString) {
      employeeWhereConditions.push(`e."Dept" = ANY(ARRAY[${departmentString}])`);
    }
    if (teamString) {
      employeeWhereConditions.push(`e."Position" = ANY(ARRAY[${teamString}])`);
    }
    if (employeeWhereConditions.length > 0) {
      employeesQuery += ` WHERE ${employeeWhereConditions.join(' AND ')}`;
    }

    // Execute the query to get all employees
    console.log(employeesQuery);
    const employeesResult = await pool.query(employeesQuery);
    const employees = employeesResult.rows;

    // Query 2: Get all WFH requests within the date range for the employees retrieved
    let wfhQuery = `
      SELECT e."Staff_ID", rd."Date", COALESCE(rd."WFH_Type", 'IN') AS "WFH_Type"
      FROM public."Employees" e
      INNER JOIN public."Request" r ON e."Staff_ID" = r."Staff_ID" AND r."Current_Status" = 'Approved'
      INNER JOIN public."RequestDetails" rd ON r."Request_ID" = rd."Request_ID" AND rd."Date" BETWEEN $1 AND $2
    `;

    const params: (string | string[])[] = [startDate, endDate];
    if (employeeWhereConditions.length > 0) {
      wfhQuery += ` WHERE ${employeeWhereConditions.join(' AND ')}`;
    }

    console.log(wfhQuery);
    const wfhResult = await pool.query(wfhQuery, params);
    const wfhRows = wfhResult.rows;
    console.log(wfhRows)

    // Generate a list of all dates between startDate and endDate
    const allDates = getAllDatesInRange(startDate, endDate);

    // Initialize a structure to hold the data for all dates
    const schedule: FullSchedule = {};

    // Create a map of employee details for quick lookup and to initialize each date's structure
    employees.forEach(employee => {
      const { Staff_ID, Staff_FName, Staff_LName, Dept, Position } = employee;

      // Initialize schedule for all dates for each employee
      allDates.forEach(date => {
        if (!schedule[date]) {
          schedule[date] = {};
        }

        if (!schedule[date][Dept]) {
          schedule[date][Dept] = {};
        }

        if (!schedule[date][Dept][Position]) {
          schedule[date][Dept][Position] = {};
        }

        // Set default WFH type as "IN" for all employees on all dates
        schedule[date][Dept][Position][Staff_ID] = {
          Staff_FName,
          Staff_LName,
          WFH_Type: 'IN'
        };
      });
    });

    // Iterate over the WFH requests and update the schedule accordingly
    wfhRows.forEach(row => {
      const { Staff_ID, Date, WFH_Type } = row;

      // Format Date to YYYY-MM-DD for comparison
      const formattedDate = format(Date, 'yyyy-MM-dd');

      // Locate the employee's entry in the schedule and update WFH type if a WFH request exists
      if (schedule[formattedDate]) {
        Object.values(schedule[formattedDate]).forEach(department => {
          Object.values(department).forEach(team => {
            if (team[Staff_ID]) {
              team[Staff_ID].WFH_Type = WFH_Type; // Update the WFH type
            }
          });
        });
      }
    });

    // Convert the schedule object to an array of objects, if needed
    const finalResult = Object.entries(schedule).map(([date, departments]) => ({
      date,
      departments: Object.entries(departments).map(([dept, teams]) => ({
        department: dept,
        teams: Object.entries(teams).map(([team, members]) => ({
          team,
          members: Object.entries(members).map(([staffId, memberDetails]) => ({
            staffId,
            ...memberDetails
          }))
        }))
      }))
    }));

    return finalResult;
  } catch (error) {
    console.error("Error fetching schedule:", error);
    throw error;
  }
};