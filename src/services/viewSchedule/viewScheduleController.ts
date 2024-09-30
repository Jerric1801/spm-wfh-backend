import { Request, Response } from 'express';
import { getScheduleByDepartment, getScheduleByTeam } from './viewScheduleService';
import { UserPayload } from '../auth/authService';

interface AuthenticatedRequest extends Request {
    user?: UserPayload;  // Use the defined `UserPayload` type
  }

export const viewScheduleManager = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;

    // Restrict access for Role 3
    if (user.Role === '3') {
      return res.status(403).json({ message: 'Access denied - not HR or senior manager.' });
    }

    // Extract query parameters
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const department = req.query.department as string | undefined; // Optional
    const team = req.query.team as string | undefined;             // Optional

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide startDate and endDate.' });
    }
    console.log(startDate, endDate, department, team)

    let schedule;

    if (user.Role === '1') {
      // Role 1 (HR): Can access all departments, optionally filter by department
      schedule = await getScheduleByDepartment(startDate, endDate, department);
    } else if (user.Role === '2') {
      // Role 2 (Manager): Default to their own department, force department view function to take in user's own department
      const userDept = user.Dept;

      if (team) {
        // If specific team(s) provided, filter by team
        schedule = await getScheduleByTeam(startDate, endDate, userDept, team);
      } else {
        // Otherwise, get the entire department's schedule
        schedule = await getScheduleByDepartment(startDate, endDate, userDept);
      }
    }

    res.status(200).json(schedule);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
