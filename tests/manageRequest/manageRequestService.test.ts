import { getPendingRequests, approveRequest, rejectRequest } from '../../src/services/manageRequest/manageRequestService';
import pool from '../../src/config/db';

jest.mock('../../src/config/db');

const mockQuery = pool.query as jest.Mock;

describe('manageRequestService', () => {
  describe('getPendingRequests', () => {
    test('should fetch all pending requests for a given managerStaffId', async () => {
      const mockRequests = [
        { Request_ID: 1, Current_Status: 'Pending', Staff_ID: 150118, Request_Reason: 'Sick', Manager_Reason: '' },
        { Request_ID: 2, Current_Status: 'Pending', Staff_ID: 150119, Request_Reason: 'Sick', Manager_Reason: '' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRequests });

      const result = await getPendingRequests('150118');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['150118']);
      expect(result).toEqual(mockRequests);
    });

    test('should throw an error if query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(getPendingRequests('150118')).rejects.toThrow('Database error');
    });
  });

  describe('approveRequest', () => {
    test('should approve a request if it is pending', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await approveRequest(1);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1]);
      expect(result).toEqual({ message: 'Request approved successfully.' });
    });

    test('should return a message if request is not found or already processed', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      const result = await approveRequest(999);
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [999]);
      expect(result).toEqual({ message: 'Request not found or already processed.' });
    });

    test('should throw an error if query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(approveRequest(1)).rejects.toThrow('Database error');
    });
  });

  describe('rejectRequest', () => {
    test('should reject a request if it is pending with a manager reason', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await rejectRequest(2, 'Some valid reason');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [2, 'Some valid reason']);
      expect(result).toEqual({ message: 'Request rejected successfully.' });
    });

    test('should return a message if request is not found or already processed', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 });

      const result = await rejectRequest(999, 'Some valid reason');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [999, 'Some valid reason']);
      expect(result).toEqual({ message: 'Request not found or already processed.' });
    });

    test('should throw an error if query fails', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      await expect(rejectRequest(2, 'Some valid reason')).rejects.toThrow('Database error');
    });

    test('should throw an error if manager reason is not provided', async () => {
      await expect(rejectRequest(2, '')).rejects.toThrow('Manager reason must be provided');
    });
  });
});
