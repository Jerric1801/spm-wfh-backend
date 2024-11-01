import { Request, Response } from 'express';
import { getScheduleService } from './viewScheduleService';
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
    const { startDate, endDate } = req.query;

    // Validating required query parameters
    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Start date and end date are required' });
      return;
    }

    // Validate date formats
    const parsedStartDate = Date.parse(startDate as string);
    const parsedEndDate = Date.parse(endDate as string);

    if (isNaN(parsedStartDate)) {
      res.status(400).json({ error: 'Invalid date format for startDate' });
      return;
    }

    if (isNaN(parsedEndDate)) {
      res.status(400).json({ error: 'Invalid date format for endDate' });
      return;
    }

    // Validate that startDate is before or equal to endDate
    if (parsedStartDate > parsedEndDate) {
      res.status(400).json({ error: 'Start date must be before or equal to end date' });
      return;
    }

    // Get the appropriate schedule service instance based on the user role
    const scheduleService = getScheduleService(user);

    // Retrieve the schedule using the service
    const schedule = await scheduleService.getSchedule(startDate as string, endDate as string);

    res.status(200).json(schedule);
  } catch (error) {
    console.error('Error in viewScheduleController for /viewSchedule endpoint:', error);
    res.status(500).json({ error: 'An error occurred while fetching the schedule' });
  }
};


