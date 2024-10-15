import { Request, Response } from 'express';
import { approveRequest, rejectRequest, getPendingRequests } from './manageRequestService'; // Assuming getPendingRequests exists

export const manageRequest = async (req: Request, res: Response) => {
    const { requestId, action } = req.body;

    try {
        let result;

        if (action === 'approve') {
            result = await approveRequest(requestId);
        } else if (action === 'reject') {
            result = await rejectRequest(requestId);
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
export const viewPendingRequests = async (req: Request, res: Response) => {
    try {
        const pendingRequests = await getPendingRequests();
        return res.status(200).json({ message: 'Pending requests fetched', data: pendingRequests });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
