import { showNotifications, acceptNotifications } from "../../src/services/notifications/notificationsController";
import { getNotifications, updateViewedStatus } from "../../src/services/notifications/notificationsService";
import { Request, Response } from "express";
import { UserPayload } from "../../src/services/auth/authService";

interface AuthenticatedRequest extends Request {
  user?: UserPayload; // Use the defined `UserPayload` type
}

jest.mock("../../src/services/notifications/notificationsService");
const mockGetNotifications = getNotifications as jest.Mock;
const mockUpdateViewedStatus = updateViewedStatus as jest.Mock;

describe("notificationsController", () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn();
    req = {};
    res = {
      status: statusMock,
      json: jsonMock,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore original implementations after each test
  });

  describe("showNotifications", () => {
    it("should return 403 unauthorized if no user is provided", async () => {
      req.user = undefined;

      await showNotifications(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it("should return 200 notifications for the user", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '1', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
      req.user = user;

      const notifications = {
        'manager': [
          { requestId: 1, currentStatus: "Pending", earliestDate: "2023-11-01", latestDate: "2023-11-03" },
        ],
        'user': [
          { requestId: 2, currentStatus: "Approved", earliestDate: "2023-11-02", latestDate: "2023-11-04" },
        ],
      };

      mockGetNotifications.mockResolvedValueOnce(notifications);

      await showNotifications(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'Pending requests fetched',
        data: notifications,
      });
    });

    it("should return 200 no pending requests message if there are no notifications", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '2', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
      req.user = user;

      const notifications = {
        'user': [] as any[],
      };

      mockGetNotifications.mockResolvedValueOnce(notifications);

      await showNotifications(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        message: 'No pending requests found.',
        data: notifications,
      });
    });

    it("should return 500 internal server error if an error occurs", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '1', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
      req.user = user;

      mockGetNotifications.mockRejectedValueOnce(new Error('Database error'));

      await showNotifications(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe("acceptNotifications", () => {
    it("should return 403 unauthorized if no user is provided", async () => {
      req.user = undefined;

      await acceptNotifications(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it("should return 200 update viewed status and return success message", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '1', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
      req.user = user;
      req.body = { requestIdArr: [1, 2, 3] };

      mockUpdateViewedStatus.mockResolvedValueOnce('Viewed status updated successfully');

      await acceptNotifications(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith('Viewed status updated successfully');
    });

    it("should return 500 internal server error if an error occurs", async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '3', Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
      req.user = user;
      req.body = { requestIdArr: [4, 5, 6] };

      mockUpdateViewedStatus.mockRejectedValueOnce(new Error('Database error'));

      await acceptNotifications(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});
