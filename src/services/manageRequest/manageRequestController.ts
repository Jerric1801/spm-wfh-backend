import { Request, Response } from 'express';
import { approveRequest, rejectRequest, getPendingRequests, getStaffRequests } from './manageRequestService'; // Assuming getPendingRequests exists
import { UserPayload } from '../auth/authService'; // Assuming UserPayload defines user data structure

interface AuthenticatedRequest extends Request {
    user?: UserPayload; // Include user data from JWT
}

export const manageRequest = async (req: Request, res: Response) => {
    const { requestId, action, managerReason } = req.body;

    try {
        let result;

        if (action === 'approve') {
            result = await approveRequest(requestId);
        } else if (action === 'reject') {
            if (!managerReason) {
                return res.status(400).json({ message: 'Manager must provide reason for rejection' });
            }
            result = await rejectRequest(requestId, managerReason);
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }

        // Return the result directly, no need to wrap it under another layer
        return res.status(200).json(result);

    } catch (error) {
        console.error('Error managing request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// New function to view pending requests
export const viewPendingRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Fetch pending requests where the reporting manager matches the current user's staff ID
        const pendingRequests = await getPendingRequests(user.Staff_ID.toString());

        // Check if there are no pending requests
        if (pendingRequests.length === 0) {
            return res.status(404).json({ message: 'No pending requests found.' });
        }

        return res.status(200).json({ message: 'Pending requests fetched', data: pendingRequests });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const viewStaffRequests = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Fetch staff requests where the Staff_ID matches the current user's staff ID
        const staffRequests = await getStaffRequests(user.Staff_ID.toString());

        // Check if there are no requests for the staff member
        if (staffRequests.length === 0) {
            return res.status(404).json({ message: 'No requests found for the staff member.' });
        }

        return res.status(200).json({ message: 'Staff requests fetched successfully', data: staffRequests });
    } catch (error) {
        console.error('Error fetching staff requests:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
