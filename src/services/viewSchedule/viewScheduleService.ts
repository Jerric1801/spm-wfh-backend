// src/services/viewScheduleService.ts

import pool from "../../config/db";
import { format, addDays, parseISO } from "date-fns";
import { UserPayload } from "../auth/authService";
import getUserDetails from "../../shared/userDetails";

// Interfaces
interface StaffDetails {
  staffId: string;
  Staff_FName: string;
  Staff_LName: string;
  WFH_Type: string;
}

interface EmployeeRecord {
  Staff_ID: string;
  Staff_FName: string;
  Staff_LName: string;
  Dept: string;
  Position: string;
}

interface WFHRequestRecord {
  Staff_ID: string;
  Date: string;
  WFH_Type: string;
}

// Abstract base class for schedule services
abstract class ScheduleService {
  protected user: UserPayload;

  constructor(user: UserPayload) {
    this.user = user;
  }

  async getSchedule(
    startDate: string,
    endDate: string
  ): Promise<
    {
      date: string;
      departments: {
        department: string;
        teams: { team: string; members: StaffDetails[] }[];
      }[];
    }[]
  > {
    try {
      const employees = await this.fetchEmployees();
      const wfhRequests = await this.fetchWFHRequests(
        startDate,
        endDate,
        employees.map((e) => e.Staff_ID)
      );
      return this.buildSchedule(employees, wfhRequests, startDate, endDate);
    } catch (error) {
      console.error("Failed to retrieve schedule:", error);
      throw new Error(`Unable to retrieve schedule. ${error}`);
    }
  }

  protected abstract fetchEmployees(): Promise<EmployeeRecord[]>;

  private async fetchWFHRequests(
    startDate: string,
    endDate: string,
    staffIds: string[]
  ): Promise<WFHRequestRecord[]> {
    try {
      const query = `
                SELECT e."Staff_ID", rd."Date", COALESCE(rd."WFH_Type", 'IN') AS "WFH_Type"
                FROM public."Employees" e
                INNER JOIN public."Request" r ON e."Staff_ID" = r."Staff_ID" AND r."Current_Status" = 'Approved'
                INNER JOIN public."RequestDetails" rd ON r."Request_ID" = rd."Request_ID" AND rd."Date" BETWEEN $1 AND $2
                WHERE e."Staff_ID" = ANY($3::int[])
            `;
      const result = await pool.query(query, [startDate, endDate, staffIds]);
      return result.rows as WFHRequestRecord[];
    } catch (error) {
      console.error("Failed to fetch WFH requests:", error);
      throw new Error("Unable to fetch WFH requests from the database.");
    }
  }

  private buildSchedule(
    employees: EmployeeRecord[],
    wfhRequests: WFHRequestRecord[],
    startDate: string,
    endDate: string
  ) {
    const schedule: {
      date: string;
      departments: {
        department: string;
        teams: { team: string; members: StaffDetails[] }[];
      }[];
    }[] = [];
    const allDates = this.getAllDatesInRange(startDate, endDate);

    // Create an employee index to simplify lookup
    const employeeIndex: {
      [staffId: string]: { dept: string; position: string };
    } = {};
    employees.forEach((emp) => {
      employeeIndex[emp.Staff_ID] = { dept: emp.Dept, position: emp.Position };
    });

    // Initialize the schedule array for each date and department
    allDates.forEach((date) => {
      const departmentMap: {
        [dept: string]: {
          department: string;
          teams: { [role: string]: StaffDetails[] };
        };
      } = {};

      employees.forEach((emp) => {
        if (!departmentMap[emp.Dept]) {
          departmentMap[emp.Dept] = { department: emp.Dept, teams: {} };
        }
        if (!departmentMap[emp.Dept].teams[emp.Position]) {
          departmentMap[emp.Dept].teams[emp.Position] = [];
        }

        // Create a new StaffDetails object for each employee on the date to avoid reference issues
        const staff: StaffDetails = {
          staffId: emp.Staff_ID,
          Staff_FName: emp.Staff_FName,
          Staff_LName: emp.Staff_LName,
          WFH_Type: "IN",
        };

        departmentMap[emp.Dept].teams[emp.Position].push(staff);
      });

      // Convert the departmentMap to the required format for each date
      const departmentsArray = Object.keys(departmentMap).map((deptKey) => {
        const department = departmentMap[deptKey];
        const teamsArray = Object.keys(department.teams).map((teamKey) => {
          return {
            team: teamKey,
            members: department.teams[teamKey],
          };
        });

        return {
          department: deptKey,
          teams: teamsArray,
        };
      });

      schedule.push({
        date: date,
        departments: departmentsArray,
      });
    });

    // Update WFH status based on requests
    wfhRequests.forEach((request) => {
      const formattedDate = format(request.Date, "yyyy-MM-dd");
      const scheduleEntry = schedule.find(
        (entry) => entry.date === formattedDate
      );
      if (scheduleEntry) {
        const employeeInfo = employeeIndex[request.Staff_ID];
        const departmentObj = scheduleEntry.departments.find(
          (dept) => dept.department === employeeInfo.dept
        );
        if (departmentObj) {
          const teamObj = departmentObj.teams.find(
            (team) => team.team === employeeInfo.position
          );
          if (teamObj) {
            const staffDetails = teamObj.members.find(
              (member) => member.staffId === request.Staff_ID
            );
            if (staffDetails) {
              staffDetails.WFH_Type = request.WFH_Type;
            }
          }
        }
      }
    });

    return schedule;
  }

  private getAllDatesInRange(start: string, end: string): string[] {
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
}

// HR Service for role 1
class HRScheduleService extends ScheduleService {
  protected async fetchEmployees(): Promise<EmployeeRecord[]> {
    try {
      const query = `
                SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
                FROM public."Employees" e
            `;
      const result = await pool.query(query);
      return result.rows as EmployeeRecord[];
    } catch (error) {
      console.error("Failed to fetch employees for HR, role 1:", error);
      throw new Error("Unable to fetch employees from the database.");
    }
  }
}

// Employee Service for role 2
class EmployeeScheduleService extends ScheduleService {
  protected async fetchEmployees(): Promise<EmployeeRecord[]> {
    try {
      const { reportingManager } = await getUserDetails(this.user.Staff_ID);
      const query = `
                SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
                FROM public."Employees" e
                WHERE e."Reporting_Manager" = $1 OR e."Staff_ID" = $2
            `;
      const result = await pool.query(query, [
        reportingManager,
        Number(reportingManager),
      ]);
      return result.rows as EmployeeRecord[];
    } catch (error) {
      console.error("Failed to fetch employees for employee, role 2:", error);
      throw new Error("Unable to fetch employees from the database.");
    }
  }
}

// Manager Service for role 3
class ManagerScheduleService extends ScheduleService {
  protected async fetchEmployees(): Promise<EmployeeRecord[]> {
    try {
      const subordinates = await this.fetchSubordinates(
        this.user.Staff_ID.toString()
      );
      const userDetails = await getUserDetails(this.user.Staff_ID);
      const peers = await this.fetchPeersAndReportingManager(
        userDetails.reportingManager.toString()
      );
      return this.mergeUniqueEmployees([...subordinates, ...peers]);
    } catch (error) {
      console.error("Failed to fetch employees for manager, role 3:", error);
      throw new Error(`Unable to fetch employees from the database. ${error}`);
    }
  }

  private async fetchSubordinates(
    managerId: string
  ): Promise<EmployeeRecord[]> {
    try {
      const query = `
                SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
                FROM public."Employees" e
                WHERE e."Reporting_Manager" = $1
            `;
      const result = await pool.query(query, [managerId]);
      return result.rows as EmployeeRecord[];
    } catch (error) {
      console.error("Failed to fetch subordinates:", error);
      throw new Error("Unable to fetch subordinates from the database.");
    }
  }

  private async fetchPeersAndReportingManager(
    reportingManager: string
  ): Promise<EmployeeRecord[]> {
    try {
      const query = `
                SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
                FROM public."Employees" e
                WHERE e."Reporting_Manager" = $1 OR e."Staff_ID" = $2
            `;
      const result = await pool.query(query, [
        reportingManager,
        Number(reportingManager),
      ]);
      return result.rows as EmployeeRecord[];
    } catch (error) {
      console.error("Failed to fetch peers and reporting manager:", error);
      throw new Error(
        "Unable to fetch peers and reporting manager from the database."
      );
    }
  }

  private mergeUniqueEmployees(employees: EmployeeRecord[]): EmployeeRecord[] {
    const uniqueEmployees = new Map<string, EmployeeRecord>();
    employees.forEach((emp) => uniqueEmployees.set(emp.Staff_ID, emp));
    return Array.from(uniqueEmployees.values());
  }
}

// Factory function to return the appropriate service instance
export function getScheduleService(user: UserPayload): ScheduleService {
  switch (user.Role) {
    case "1":
      return new HRScheduleService(user);
    case "2":
      return new EmployeeScheduleService(user);
    case "3":
      return new ManagerScheduleService(user);
  }
}
