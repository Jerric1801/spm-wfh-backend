import { manageRequest, viewPendingRequests } from '../../src/services/manageRequest/manageRequestController';
import { approveRequest, rejectRequest, getPendingRequests } from "../../src/services/manageRequest/manageRequestService";
import { Request, Response } from 'express';
import { UserPayload } from '../../src/services/auth/authService';

interface AuthenticatedRequest extends Request {
    user?: UserPayload;  // Use the defined `UserPayload` type
  }

jest.mock('../../src/services/manageRequest/manageRequestService');

const mockApproveRequest = approveRequest as jest.Mock;
const mockRejectRequest = rejectRequest as jest.Mock;
const mockGetPendingRequests = getPendingRequests as jest.Mock;

describe('manageRequestController', () => {
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
    jest.restoreAllMocks();  // Restore original implementations after each test
});

  describe('manageRequest', () => {
    test('should approve a request when action is approve', async () => {
      req.body = { requestId: 1, action: 'approve' };
      mockApproveRequest.mockResolvedValue({ message: 'Request approved successfully.' });

      await manageRequest(req as AuthenticatedRequest, res as Response);

      expect(mockApproveRequest).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Request approved successfully.' });
    });

    test('should reject a request when action is reject', async () => {
      req.body = { requestId: 2, action: 'reject', managerReason: 'invalid reason' };
      mockRejectRequest.mockResolvedValue({ message: 'Request rejected successfully.' });

      await manageRequest(req as AuthenticatedRequest, res as Response);

      expect(mockRejectRequest).toHaveBeenCalledWith(2, 'invalid reason');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Request rejected successfully.' });
    });

    test('should return 400 if manager did not provide reason', async () => {
      req.body = { requestId: 2, action: 'reject'};
      mockRejectRequest.mockRejectedValue({ message: 'Request rejected successfully.' });

      await manageRequest(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Manager must provide reason for rejection' });
    });

    test('should return 400 for an invalid action', async () => {
      req.body = { requestId: 3, action: 'invalidAction' };

      await manageRequest(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Invalid action' });
    });

    test('should return 500 if an error occurs', async () => {
      req.body = { requestId: 4, action: 'approve' };
      mockApproveRequest.mockRejectedValue(new Error('Database error'));

      await manageRequest(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('viewPendingRequests', () => {
    test('should return 403 if user is not authenticated', async () => {
      req.user = undefined;

      await viewPendingRequests(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    test('should return 404 if no pending requests are found', async () => {
      req.user = { Staff_ID: 150118 } as UserPayload;
      mockGetPendingRequests.mockResolvedValue([]);

      await viewPendingRequests(req as AuthenticatedRequest, res as Response);

      expect(mockGetPendingRequests).toHaveBeenCalledWith('150118');
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'No pending requests found.' });
    });

    test('should return 200 and the pending requests if found', async () => {
      req.user = { Staff_ID: 150118 } as UserPayload;
      const pendingRequests = [
        { Request_ID: 1, Current_Status: 'Pending', Staff_ID: 150118 },
      ];
      mockGetPendingRequests.mockResolvedValue(pendingRequests);

      await viewPendingRequests(req as AuthenticatedRequest, res as Response);

      expect(mockGetPendingRequests).toHaveBeenCalledWith('150118');
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Pending requests fetched', data: pendingRequests });
    });

    test('should return 500 if an error occurs', async () => {
      req.user = { Staff_ID: 150118 } as UserPayload;
      mockGetPendingRequests.mockRejectedValue(new Error('Database error'));

      await viewPendingRequests(req as AuthenticatedRequest, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });
});