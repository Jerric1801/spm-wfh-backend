// src/services/applyWFH/applyWFHController.ts
import { Request, Response } from 'express';
import { applyForWorkFromHome } from './applyWFHService';
import { UserPayload } from '../auth/authService';
import { parseISO, isBefore } from 'date-fns';

interface AuthenticatedRequest extends Request {
    user?: UserPayload;  // Use the defined `UserPayload` type
}

interface ApplyWFHRequestBody {
    Dates: string[]; // Changed to Dates array of ISO strings
    WFHType: 'AM' | 'PM' | 'WD'; 
    WFHReason: string;
    Document: string[]; // Added Document array for base64 strings
}

interface WorkFromHomeRequest {
    Staff_ID: number; // Assuming Staff_ID is a number
    Dates: Date[];    // Dates are now parsed as Date objects
    WFHType: 'AM' | 'PM' | 'WD';
    WFHReason: string;
    Document?: string[];
}

export const requestWorkFromHome = async (req: AuthenticatedRequest, res: Response) => {
    try {
        console.log("reached controller")
        const user = req.user;
        const { Dates, WFHType, WFHReason, Document }: ApplyWFHRequestBody = req.body;

        // Check all fields provided
        if (!Dates || !WFHType || !WFHReason) {
            console.log('Please provide Dates, WFHType and WFHReason')
            return res.status(400).json({ message: 'Please provide Dates, WFHType and WFHReason' });
        }

        // Validate Dates (assuming they are ISO date strings)
        const parsedDates = Dates.map(dateStr => parseISO(dateStr));
        for (let i = 1; i < parsedDates.length; i++) {
            if (isBefore(parsedDates[i], parsedDates[i - 1])) {
                return res.status(400).json({ message: 'Dates must be in ascending order.' });
            }
        }

        // Validate WFHType
        const validWFHTypes = ['AM', 'PM', 'WD'];
        if (!validWFHTypes.includes(WFHType)) {
            console.log("Invalid work-from-home type. Must be one of AM, PM, or WD.")
            return res.status(400).json({ message: 'Invalid work-from-home type. Must be one of AM, PM, or WD.' });
        }

        // Create the work-from-home request object (adjust as needed)
        const workFromHomeRequest: WorkFromHomeRequest = { 
            Staff_ID: user?.Staff_ID!,
            Dates: parsedDates, 
            WFHType,
            WFHReason,
            ...(Document && { Document })
        };

        // Call the service to apply for work-from-home
        const result = await applyForWorkFromHome(workFromHomeRequest);
        return res.status(200).json({ message: 'Work-from-home request submitted successfully', data: result });

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

