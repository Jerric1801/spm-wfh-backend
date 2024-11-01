// src/services/viewScheduleService.ts

import pool from "../../config/db";
import { format, addDays, parseISO } from "date-fns";
import { UserPayload } from "../auth/authService";
import getUserDetails from "../../shared/userDetails";

// Interfaces
interface StaffDetails {
    staffId: string;
    firstName: string;
    lastName: string;
    wfhType: string;
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

    async getSchedule(startDate: string, endDate: string): Promise<{
        [date: string]: {
            [department: string]: {
                [role: string]: { [staffId: string]: StaffDetails };
            };
        };
    }> {
        const employees = await this.fetchEmployees();
        const wfhRequests = await this.fetchWFHRequests(startDate, endDate, employees.map(e => e.Staff_ID));
        return this.buildSchedule(employees, wfhRequests, startDate, endDate);
    }

    protected abstract fetchEmployees(): Promise<EmployeeRecord[]>;

    private async fetchWFHRequests(startDate: string, endDate: string, staffIds: string[]): Promise<WFHRequestRecord[]> {
        const query = `
            SELECT e."Staff_ID", rd."Date", COALESCE(rd."WFH_Type", 'IN') AS "WFH_Type"
            FROM public."Employees" e
            INNER JOIN public."Request" r ON e."Staff_ID" = r."Staff_ID" AND r."Current_Status" = 'Approved'
            INNER JOIN public."RequestDetails" rd ON r."Request_ID" = rd."Request_ID" AND rd."Date" BETWEEN $1 AND $2
            WHERE e."Staff_ID" = ANY($3::int[])
        `;
        const result = await pool.query(query, [startDate, endDate, staffIds]);
        return result.rows as WFHRequestRecord[];
    }

    private buildSchedule(employees: EmployeeRecord[], wfhRequests: WFHRequestRecord[], startDate: string, endDate: string) {
        const schedule: { [date: string]: { [department: string]: { [role: string]: { [staffId: string]: StaffDetails } } } } = {};
        const allDates = this.getAllDatesInRange(startDate, endDate);

        const employeeIndex: { [staffId: string]: { dept: string; position: string } } = {};
        employees.forEach(emp => {
          employeeIndex[emp.Staff_ID] = { dept: emp.Dept, position: emp.Position };
          allDates.forEach(date => {
              if (!schedule[date]) schedule[date] = {};
              if (!schedule[date][emp.Dept]) schedule[date][emp.Dept] = {};
              if (!schedule[date][emp.Dept][emp.Position]) schedule[date][emp.Dept][emp.Position] = {};
      
              // Create a new StaffDetails object for each date to avoid reference issues
              const staff: StaffDetails = {
                  staffId: emp.Staff_ID,
                  firstName: emp.Staff_FName,
                  lastName: emp.Staff_LName,
                  wfhType: "IN",
              };
      
              schedule[date][emp.Dept][emp.Position][emp.Staff_ID] = staff;
          });
      });
      


      wfhRequests.forEach(request => {
        const formattedDate = format(parseISO(request.Date), "yyyy-MM-dd");
    
        console.log(`Processing WFH request for Staff ID: ${request.Staff_ID} on Date: ${formattedDate}`);
        
        if (!schedule[formattedDate]) {
            console.warn(`Date ${formattedDate} not found in schedule.`);
            return;
        }
    
        const employeeInfo = employeeIndex[request.Staff_ID];
        if (!employeeInfo) {
            console.warn(`Employee with Staff ID ${request.Staff_ID} not found in index.`);
            return;
        }
    
        if (!schedule[formattedDate][employeeInfo.dept]) {
            console.warn(`Department ${employeeInfo.dept} not found in schedule for date ${formattedDate}.`);
            return;
        }
    
        if (!schedule[formattedDate][employeeInfo.dept][employeeInfo.position]) {
            console.warn(`Position ${employeeInfo.position} not found in department ${employeeInfo.dept} for date ${formattedDate}.`);
            return;
        }
    
        // Access the specific StaffDetails object and update its wfhType
        const staffDetails = schedule[formattedDate][employeeInfo.dept][employeeInfo.position][request.Staff_ID];
        const previousWFHType = staffDetails.wfhType;
        console.log(`Previous WFH Type for Staff ID ${request.Staff_ID} on ${formattedDate}: ${previousWFHType}`);
        
        // Update the wfhType
        staffDetails.wfhType = request.WFH_Type;
        console.log(`Updated WFH Type for Staff ID ${request.Staff_ID} on ${formattedDate} to ${request.WFH_Type}`);
        
        // Confirm the change
        console.log(`Final WFH Type for Staff ID ${request.Staff_ID} on ${formattedDate}: ${staffDetails.wfhType}`);
    });
    

        console.log(schedule['2023-10-01'])
        console.log(schedule['2023-10-01']['HR']['Manager']["1"])
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
        const query = `
            SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
            FROM public."Employees" e
        `;
        const result = await pool.query(query);
        return result.rows as EmployeeRecord[];
    } 
}

// Employee Service for role 2
class EmployeeScheduleService extends ScheduleService {
    protected async fetchEmployees(): Promise<EmployeeRecord[]> {
        const { reportingManager } = await getUserDetails(this.user.Staff_ID);
        const query = `
            SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
            FROM public."Employees" e
            WHERE e."Reporting_Manager" = $1 OR e."Staff_ID" = $2
        `;
        const result = await pool.query(query, [reportingManager, Number(reportingManager)]);
        return result.rows as EmployeeRecord[];
    }
}

// Manager Service for role 3
class ManagerScheduleService extends ScheduleService {
    protected async fetchEmployees(): Promise<EmployeeRecord[]> {
        const subordinates = await this.fetchSubordinates(this.user.Staff_ID.toString());
        const userDetails = await getUserDetails(this.user.Staff_ID);
        const peers = await this.fetchPeers(userDetails.reportingManager);
        return this.mergeUniqueEmployees([...subordinates, ...peers]);
    }

    private async fetchSubordinates(managerId: string): Promise<EmployeeRecord[]> {
        const { conditions, whereParams } = this.buildWhereClause(managerId);
        const query = `
            SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
            FROM public."Employees" e
            ${conditions ? `WHERE ${conditions}` : ""}
        `;
        const result = await pool.query(query, whereParams);
        return result.rows as EmployeeRecord[];
    }

    private async fetchPeers(reportingManager: string): Promise<EmployeeRecord[]> {
        const { conditions, whereParams } = this.buildWhereClause(reportingManager);
        const query = `
            SELECT e."Staff_ID", e."Staff_FName", e."Staff_LName", e."Dept", e."Position"
            FROM public."Employees" e
            ${conditions ? `WHERE ${conditions}` : ""}
        `;
        const result = await pool.query(query, whereParams);
        return result.rows as EmployeeRecord[];
    }

    private buildWhereClause(reportingManager: string, departmentArray: string[] = [], positionArray: string[] = []): { conditions: string; whereParams: (string | string[] | number)[] } {
        const conditions: string[] = [];
        const whereParams: (string | string[] | number)[] = [];

        if (reportingManager) {
            conditions.push(`e."Reporting_Manager" = $${whereParams.length + 1} OR e."Staff_ID" = $${whereParams.length + 2}`);
            whereParams.push(reportingManager, Number(reportingManager));
        }

        if (departmentArray.length) {
            conditions.push(`e."Dept" = ANY($${whereParams.length + 1}::text[])`);
            whereParams.push(departmentArray);
        }

        if (positionArray.length) {
            conditions.push(`e."Position" = ANY($${whereParams.length + 1}::text[])`);
            whereParams.push(positionArray);
        }

        return { conditions: conditions.join(" AND "), whereParams };
    }

    private mergeUniqueEmployees(employees: EmployeeRecord[]): EmployeeRecord[] {
        const uniqueEmployees = new Map<string, EmployeeRecord>();
        employees.forEach(emp => uniqueEmployees.set(emp.Staff_ID, emp));
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
        default:
            throw new Error("Invalid user role");
    }
}
