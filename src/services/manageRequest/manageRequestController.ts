import { Request, Response } from 'express';
import { approveRequest, rejectRequest, getPendingRequests, getStaffRequests,withdrawRequestService,getPendingRequestCount } from './manageRequestService'; // Assuming getPendingRequests exists
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
        console.log("User:", user); // Check if the user is correctly set

        if (!user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const staffRequests = await getStaffRequests(user.Staff_ID.toString());
        console.log("Staff Requests:", staffRequests); // Log the response from getStaffRequests

        if (staffRequests.length === 0) {
            return res.status(404).json({ message: 'No requests found for the staff member.' });
        }

        return res.status(200).json({ message: 'Staff requests fetched successfully', data: staffRequests });
    } catch (error) {
        console.error('Error fetching staff requests:', error); // Log the full error details
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const viewRequests = async (req: AuthenticatedRequest, res: Response) => {
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

export const withdrawRequest = async (req: AuthenticatedRequest, res: Response) => {
    const { requestId, requestReason } = req.body;

    try {
        // Check if user is authenticated
        const user = req.user;
        if (!user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Check if a request reason is provided
        if (!requestReason) {
            return res.status(400).json({ message: 'Request reason must be provided' });
        }

        // Call the service to update the request status to "Withdrawn" and set Request_Reason
        const result = await withdrawRequestService(requestId, user.Staff_ID.toString(), requestReason);

        // Check if the request was successfully updated
        if (result.rowCount > 0) {
            return res.status(200).json({ message: 'Request withdrawn successfully' });
        } else {
            return res.status(404).json({ message: 'Request not found or already processed' });
        }
    } catch (error) {
        console.error('Error withdrawing request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const getPendingRequestCountController = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const pendingCount = await getPendingRequestCount(user.Staff_ID.toString());
        return res.status(200).json({ pendingCount });
    } catch (error) {
        console.error('Error fetching pending request count:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
