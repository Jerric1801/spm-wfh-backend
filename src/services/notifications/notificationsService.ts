import pool from '../../config/db';
import { UserPayload } from '../auth/authService';

interface Notification {
    requestId: number;
    currentStatus: string;
    earliestDate: string;
    latestDate: string;
}

export const getNotifications = async (user: UserPayload): Promise<{ manager?: Notification[]; user: Notification[] }> => {
    try {
        const managerNotifications: Notification[] = [];
        const userNotifications: Notification[] = [];

        const userId = user.Staff_ID;
        const role = user.Role;

        // Query for roles 1 and 3: where the user's staff_id matches reporting manager and manager_seen is false
        if (role === '1' || role === '3') {
            const managerQuery = `
                SELECT r."Request_ID" AS "requestId", r."Current_Status" AS "currentStatus",
                       MIN(rd."Date") AS "earliestDate", MAX(rd."Date") AS "latestDate"
                FROM public."Request" r
                INNER JOIN public."Employees" e ON e."Staff_ID" = r."Staff_ID"
                INNER JOIN public."RequestDetails" rd ON r."Request_ID" = rd."Request_ID"
                WHERE e."Reporting_Manager" = $1
                  AND r."Manager_Seen" = FALSE
                GROUP BY r."Request_ID"
            `;
            const managerResults = await pool.query(managerQuery, [userId.toString()]);
            managerNotifications.push(...managerResults.rows);
        }

        // Query for all roles 1, 2, 3: where staff_id equals user_id
        const userQuery = `
            SELECT r."Request_ID" AS "requestId", r."Current_Status" AS "currentStatus",
                   MIN(rd."Date") AS "earliestDate", MAX(rd."Date") AS "latestDate"
            FROM public."Request" r
            INNER JOIN public."RequestDetails" rd ON r."Request_ID" = rd."Request_ID"
            WHERE r."Staff_ID" = $1
              AND r."User_Seen" = FALSE
            GROUP BY r."Request_ID"
        `;
        const userResults = await pool.query(userQuery, [userId]);
        userNotifications.push(...userResults.rows);

        if (role === '2') {
            console.log(userNotifications)
            return { user: userNotifications };
        }
        console.log(userNotifications, managerNotifications)
        return { manager: managerNotifications, user: userNotifications };
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw new Error('Unable to fetch notifications from the database.');
    }
};

export const updateViewedStatus = async (user: UserPayload, requestIdArr: number[]): Promise<string> => {
    try {
        const userId = user.Staff_ID;
        const role = user.Role;

        // Update User_Seen to TRUE where Staff_ID = userId and Request_ID in requestIdArr
        const userSeenQuery = `
            UPDATE public."Request"
            SET "User_Seen" = TRUE
            WHERE "Staff_ID" = $1
              AND "Request_ID" = ANY($2::int[])
        `;
        await pool.query(userSeenQuery, [userId, requestIdArr]);

        // If role is 1 or 3, also update Manager_Seen to TRUE where Reporting_Manager matches userId
        if (role === '1' || role === '3') {
            const managerSeenQuery = `
                UPDATE public."Request"
                SET "Manager_Seen" = TRUE
                WHERE "Request_ID" = ANY($1::int[])
                  AND "Staff_ID" IN (
                    SELECT "Staff_ID"
                    FROM public."Employees"
                    WHERE "Reporting_Manager" = $2
                  )
            `;
            await pool.query(managerSeenQuery, [requestIdArr, userId.toString()]);
        }

        return 'Viewed status updated successfully';
    } catch (error) {
        console.error('Error updating viewed status:', error);
        throw new Error('Unable to update viewed status in the database.');
    }
};

