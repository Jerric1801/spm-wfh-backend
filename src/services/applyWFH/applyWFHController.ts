// src/services/applyWFH/applyWFHController.ts
import { Request, Response } from 'express';
import { applyForWorkFromHome } from './applyWFHService';
import { UserPayload } from '../auth/authService';
import { parseISO, isBefore } from 'date-fns';

interface AuthenticatedRequest extends Request {
    user?: UserPayload;  // Use the defined `UserPayload` type
}

interface ApplyWFHRequestBody {
    dateRange: { startDate: string; endDate: string };
    wfhType: 'AM' | 'PM' | 'WD';
    reason: string;
}

export const requestWorkFromHome = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        // Validate required parameters
        const { dateRange, wfhType, reason }: ApplyWFHRequestBody = req.body;
        
        // Check for required fields
        if (!dateRange || !dateRange.startDate || !dateRange.endDate || !wfhType || !reason) {
            return res.status(400).json({ message: 'Please provide dateRange, wfhType, and reason.' });
        }

        // Validate wfhType
        const validWFHTypes = ['AM', 'PM', 'WD'];
        if (!validWFHTypes.includes(wfhType)) {
            return res.status(400).json({ message: 'Invalid wfhType. Must be one of AM, PM, or WD.' });
        }

        // Validate endDate
        const startDate = parseISO(dateRange.startDate);
        const endDate = parseISO(dateRange.endDate);
        if (isBefore(endDate, startDate)) {
            return res.status(400).json({ message: 'endDate must be the same or after startDate.' });
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
        res.status(200).json({ message: 'Work-from-home request submitted successfully', data: result});
    } catch (err) {
        console.error(err);
        
        if (err.message === "Conflicting request dates found.") {
            return res.status(409).json({ error: 'Conflicting request dates found. Please choose different dates.' });
        }

        // Default to internal server error
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

