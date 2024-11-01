import { getPendingRequests, approveRequest, rejectRequest } from '../../src/services/manageRequest/manageRequestService';
import pool from '../../src/config/db';

jest.mock('../../src/config/db');

const mockQuery = pool.query as jest.Mock;

describe('manageRequestService', () => {
  describe('getPendingRequests', () => {
    test('should fetch all pending requests for a given managerStaffId', async () => {
      const mockRequests = [
        {
          Request_ID: 1,
          Current_Status: 'Pending',
          Staff_ID: 150118,
          Request_Reason: 'Sick',
          Manager_Reason: '',
          Staff_FName: 'John',
          Staff_LName: 'Doe',
          dates: [new Date('2024-10-25'), new Date('2024-10-26')],
          wfh_types: ['Full Day']
        },
        {
          Request_ID: 2,
          Current_Status: 'Pending',
          Staff_ID: 150119,
          Request_Reason: 'Vacation',
          Manager_Reason: '',
          Staff_FName: 'Jane',
          Staff_LName: 'Doe',
          dates: [], // No dates for this request
          wfh_types: []  // No WFH types for this request
        },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRequests });

      const result = await getPendingRequests('150118');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['150118']);

      // Expect the transformed data
      expect(result).toEqual([
        {
          key: '1',
          id: 150118,
          member: 'John Doe',
          dateRange: '25 Oct - 26 Oct',
          wfhType: 'Full Day',
          reason: 'Sick'
        },
        {
          key: '2',
          id: 150119,
          member: 'Jane Doe',
          dateRange: '', // Expect empty date range
          wfhType: undefined, // Expect undefined wfhType
          reason: 'Vacation'
        }
      ]);
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
  });
});
