import { Request, Response } from 'express';
import { getScheduleForUser } from './viewScheduleService';
import { UserPayload } from '../auth/authService';

/**
 * Interface representing an authenticated request, with a user payload.
 */
interface AuthenticatedRequest extends Request {
  user?: UserPayload;  // Use the defined `UserPayload` type
}

/**
 * Controller function for handling /viewSchedule GET endpoint for all roles.
 * This function retrieves the schedule for the authenticated user based on their role.
 *
 * @param {AuthenticatedRequest} req - The request object, containing user information and query parameters.
 * @param {Response} res - The response object to send the schedule data back to the client.
 */
export const viewSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user: UserPayload = req.user;
    const { startDate, endDate, departments, positions } = req.query;

    // Validating required query parameters
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Start date and end date are required' });
      return;
    }

    // Let the service layer determine what schedule the user can access
    const schedule = await getScheduleForUser(user, startDate as string, endDate as string, departments as string[], positions as string[]);

    res.status(200).json(schedule);
  } catch (error) {
    console.error('Error in viewScheduleController for /viewSchedule endpoint:', error);
    res.status(500).json({ error: 'An error occurred while fetching the schedule' });
  }
};
