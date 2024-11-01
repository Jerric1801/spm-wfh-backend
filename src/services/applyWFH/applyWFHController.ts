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
    recurringDays: string[];
    wfhType: 'AM' | 'PM' | 'WD';
    reason: string;
}

export const requestWorkFromHome = async (req: AuthenticatedRequest, res: Response) => {
    try {
        
        const user = req.user;
        const { dateRange, recurringDays, wfhType, reason }: ApplyWFHRequestBody = req.body;
        
        // Check all fields provided
        if (!dateRange || !dateRange.startDate || !dateRange.endDate || !recurringDays || !wfhType || !reason) {
            return res.status(400).json({ message: 'Please provide dateRange, recurringDays, wfhType, and reason.' });
        }

        // Validate dateRange
        const startDate = parseISO(dateRange.startDate);
        const endDate = parseISO(dateRange.endDate);
        if (isBefore(endDate, startDate)) {
            return res.status(400).json({ message: 'The end date must be the same or after the start date.' });
        }

        // Validate recurringDays
        const ValidRecurringDays = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

        function areValidRecurringDays(recurringDays: string[]): boolean {
            return recurringDays.every(day => ValidRecurringDays.includes(day));
        }

        if (!Array.isArray(recurringDays) || !areValidRecurringDays(recurringDays)) {
            return res.status(400).json({ message: 'Only provide valid days of the week.' });
        }

        // Validate wfhType
        const validWFHTypes = ['AM', 'PM', 'WD'];
        if (!validWFHTypes.includes(wfhType)) {
            return res.status(400).json({ message: 'Invalid work-from-home type. Must be one of AM, PM, or WD.' });
        }

        // Create the work-from-home request object
        const workFromHomeRequest = {
            Staff_ID: user?.Staff_ID,
            dateRange,
            recurringDays,
            wfhType,
            reason
        };

        // Call the service to apply for work-from-home
        const result = await applyForWorkFromHome(workFromHomeRequest);
        res.status(200).json({ message: 'Work-from-home request submitted successfully', data: result});
    } catch (err) {
        console.error(err);
        
        const DEFAULT_ERROR_MESSAGE = 'Internal Server Error';

        const errorResponses: Record<string, string> = {
            "No suitable dates found.": 'No suitable dates found. Please choose a different date range or weekday.',
            "Conflicting request dates found.": 'Conflicting request dates found. Please choose a different date range.',
        };
        
        // select errorMessage if exist
        const errorMessage = errorResponses[err.message];

        if (errorMessage) {
            return res.status(409).json({ error: errorMessage });
        } else {
            return res.status(500).json({ error: DEFAULT_ERROR_MESSAGE });
        }
    }
};
