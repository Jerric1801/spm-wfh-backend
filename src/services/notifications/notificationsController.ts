import { Request, Response } from 'express';
import { getNotifications, updateViewedStatus } from './notificationsService'; // Assuming getPendingRequests exists
import { UserPayload } from '../auth/authService'; // Assuming UserPayload defines user data structure

interface AuthenticatedRequest extends Request {
    user?: UserPayload; // Include user data from JWT
}

export const showNotifications = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const notifications = await getNotifications(user);

        const hasManagerNotifications = notifications.manager && notifications.manager.length > 0;
        const hasUserNotifications = notifications.user.length > 0;

        if (!hasManagerNotifications && !hasUserNotifications) {
            return res.status(200).json({ message: 'No pending requests found.', data: notifications });
        }

        return res.status(200).json({
            message: 'Pending requests fetched',
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching pending requests:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

export const acceptNotifications = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;

    if (!user) {
        return res.status(403).json({ message: 'Unauthorized' });
    }

    const { requestIdArr } = req.body;

    try {

        const result = await updateViewedStatus(user, requestIdArr);
        return res.status(200).json(result);

    } catch (error) {
        console.error('Error managing request:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};