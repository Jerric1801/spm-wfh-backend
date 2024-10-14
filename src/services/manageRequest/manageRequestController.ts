import { Request, Response } from 'express';
import { approveRequest, rejectRequest, getPendingRequests } from './manageRequestService'; // Assuming getPendingRequests exists

export const manageRequest = async (req: Request, res: Response) => {
    const { requestId, action } = req.body;

    try {
        if (action === 'approve') {
            const result = await approveRequest(requestId);
            return res.status(200).json({ message: 'Request approved', data: result });
        } else if (action === 'reject') {
            const result = await rejectRequest(requestId);
            return res.status(200).json({ message: 'Request rejected', data: result });
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }
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
