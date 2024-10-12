// src/services/applyWFH/applyWFHController.ts
import { Request, Response } from 'express';
import { applyForWorkFromHome } from './applyWFHService';
import { UserPayload } from '../auth/authService';

interface AuthenticatedRequest extends Request {
    user?: UserPayload;  // Use the defined `UserPayload` type
}

interface ApplyWFHRequestBody {
    dateRange: { startDate: string; endDate: string };
    wfhType: 'AM' | 'PM' | 'Full Day';
    reason: string;
}

export const requestWorkFromHome = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;

        // Validate required parameters
        const { dateRange, wfhType, reason }: ApplyWFHRequestBody = req.body;
        if (!dateRange || !dateRange.startDate || !dateRange.endDate || !wfhType || !reason) {
            return res.status(400).json({ message: 'Please provide dateRange, wfhType, and reason.' });
        }

        // Create the work-from-home request object
        const workFromHomeRequest = {
            Staff_ID: user?.Staff_ID,
            dateRange,
            wfhType,
            reason
        };

        // Call the service to apply for work-from-home
        const result = await applyForWorkFromHome(workFromHomeRequest);

        res.status(200).json({ message: 'Work-from-home request submitted successfully', data: result });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
