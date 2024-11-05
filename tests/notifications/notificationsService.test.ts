import { getNotifications, updateViewedStatus } from "../../src/services/notifications/notificationsService";
import pool from "../../src/config/db";
import { UserPayload } from "../../src/services/auth/authService";

jest.mock("../../src/config/db");

const mockQuery = pool.query as jest.Mock;

describe("notificationService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getNotifications", () => {
    it("should return manager and user notifications for role 1", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '1', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };

      mockQuery
        .mockResolvedValueOnce({ rows: [
          { requestId: 1, currentStatus: "Pending", earliestDate: "2023-11-01", latestDate: "2023-11-03" },
        ]})
        .mockResolvedValueOnce({ rows: [
          { requestId: 2, currentStatus: "Approved", earliestDate: "2023-11-02", latestDate: "2023-11-04" },
        ]});

      const result = await getNotifications(user);

      expect(result).toEqual({
        manager: [
          { requestId: 1, currentStatus: "Pending", earliestDate: "2023-11-01", latestDate: "2023-11-03" },
        ],
        user: [
          { requestId: 2, currentStatus: "Approved", earliestDate: "2023-11-02", latestDate: "2023-11-04" },
        ],
      });

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE e."Reporting_Manager" = $1'), [user.Staff_ID.toString()]);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE r."Staff_ID" = $1'), [user.Staff_ID]);
    });

    it("should return manager and user notifications for role 3", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '3', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "Sales", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Accounts Manager" };

      mockQuery
        .mockResolvedValueOnce({ rows: [
          { requestId: 3, currentStatus: "Pending", earliestDate: "2023-11-05", latestDate: "2023-11-07" },
        ]})
        .mockResolvedValueOnce({ rows: [
          { requestId: 4, currentStatus: "Approved", earliestDate: "2023-11-06", latestDate: "2023-11-08" },
        ]});

      const result = await getNotifications(user);

      expect(result).toEqual({
        manager: [
          { requestId: 3, currentStatus: "Pending", earliestDate: "2023-11-05", latestDate: "2023-11-07" },
        ],
        user: [
          { requestId: 4, currentStatus: "Approved", earliestDate: "2023-11-06", latestDate: "2023-11-08" },
        ],
      });

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE e."Reporting_Manager" = $1'), [user.Staff_ID.toString()]);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE r."Staff_ID" = $1'), [user.Staff_ID]);
    });

    it("should return only user notifications for role 2", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '2', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "Engineering", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Junior Engineer" };

      mockQuery.mockResolvedValueOnce({ rows: [
        { requestId: 5, currentStatus: "Pending", earliestDate: "2023-11-09", latestDate: "2023-11-11" },
      ]});

      const result = await getNotifications(user);

      expect(result).toEqual({
        user: [
          { requestId: 5, currentStatus: "Pending", earliestDate: "2023-11-09", latestDate: "2023-11-11" },
        ],
      });

      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('WHERE r."Staff_ID" = $1'), [user.Staff_ID]);
    });

    it("should handle database errors gracefully", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '1', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(getNotifications(user)).rejects.toThrow('Unable to fetch notifications from the database.');
    });
  });

  describe("updateViewedStatus", () => {
    it("should update user and manager seen status for role 1", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '1', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
      const requestIdArr = [1, 2, 3];

      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({});

      const result = await updateViewedStatus(user, requestIdArr);

      expect(result).toBe('Viewed status updated successfully');
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SET "User_Seen" = TRUE'), [user.Staff_ID, requestIdArr]);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SET "Manager_Seen" = TRUE'), [requestIdArr, user.Staff_ID.toString()]);
    });

    it("should update user and manager seen status for role 3", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '3', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "Sales", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Accounts Manager" };
      const requestIdArr = [4, 5, 6];

      mockQuery.mockResolvedValueOnce({});
      mockQuery.mockResolvedValueOnce({});

      const result = await updateViewedStatus(user, requestIdArr);

      expect(result).toBe('Viewed status updated successfully');
      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SET "User_Seen" = TRUE'), [user.Staff_ID, requestIdArr]);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SET "Manager_Seen" = TRUE'), [requestIdArr, user.Staff_ID.toString()]);
    });

    it("should update only user seen status for role 2", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '2', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Junior Engineer" };
      const requestIdArr = [7, 8];

      mockQuery.mockResolvedValueOnce({});

      const result = await updateViewedStatus(user, requestIdArr);

      expect(result).toBe('Viewed status updated successfully');
      expect(mockQuery).toHaveBeenCalledTimes(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SET "User_Seen" = TRUE'), [user.Staff_ID, requestIdArr]);
    });

    it("should handle database errors gracefully", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '3', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
      const requestIdArr = [9, 10];

      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(updateViewedStatus(user, requestIdArr)).rejects.toThrow('Unable to update viewed status in the database.');
    });
  });
});
