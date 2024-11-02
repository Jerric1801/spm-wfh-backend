import { getPendingRequests, approveRequest, rejectRequest , getRequests,getStaffRequests,withdrawRequestService, getPendingRequestCount} from '../../src/services/manageRequest/manageRequestService';
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

  
describe('getAllRequests', () => { 
  test('should fetch all requests for a given managerStaffId', async () => { 
    const mockRequests = [
      {
        Request_ID: 5,
        Staff_ID: 180005,
        Current_Status: 'Pending',
        Created_At: "2024-03-03T00:00:00.000Z",
        Last_Updated: "2024-03-10T00:00:00.000Z",
        Request_Reason: 'Urgent deadline',
        Manager_Reason: ''
      },
      {
        Request_ID: 45,
        Staff_ID: 180013,
        Current_Status: 'Rejected',
        Created_At: "2024-02-21T00:00:00.000Z",
        Last_Updated: "2024-04-28T00:00:00.000Z",
        Request_Reason: 'Policy change',
        Manager_Reason: 'Invalid Reason'
      },
      {
        Request_ID: 3,
        Staff_ID: 180019,
        Current_Status: 'Pending',
        Created_At: "2024-03-11T00:00:00.000Z",
        Last_Updated: "2024-05-03T00:00:00.000Z",
        Request_Reason: 'Policy change',
        Manager_Reason: ''
      },
      {
        Request_ID: 44,
        Staff_ID: 180021,
        Current_Status: 'Approved',
        Created_At: "2024-06-01T00:00:00.000Z",
        Last_Updated: "2024-10-02T00:00:00.000Z",
        Request_Reason: 'Team restructuring',
        Manager_Reason: ''
      },
      {
        Request_ID: 14,
        Staff_ID: 180025,
        Current_Status: 'Pending',
        Created_At: "2024-03-13T00:00:00.000Z",
        Last_Updated: "2024-07-18T00:00:00.000Z",
        Request_Reason: 'Urgent deadline',
        Manager_Reason: ''
      },
      {
        Request_ID: 29,
        Staff_ID: 180033,
        Current_Status: 'Rejected',
        Created_At: "2024-03-04T00:00:00.000Z",
        Last_Updated: "2024-07-01T00:00:00.000Z",
        Request_Reason: 'Training requirement',
        Manager_Reason: 'Invalid Reason'
      }
    ];
    
    // Mock query result
    mockQuery.mockResolvedValueOnce({ rows: mockRequests });

    // Execute function
    const result = await getRequests('180001');

    // Test assertions
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['180001']);
    expect(result).toEqual(mockRequests);
  });

  test('should throw an error if query fails', async () => {
    // Mock a rejected query
    mockQuery.mockRejectedValueOnce(new Error('Database error'));

    // Expect an error to be thrown
    await expect(getRequests('180001')).rejects.toThrow('Database error');
  });
});
describe('getRequests', () => {
  test('should fetch all requests for a given managerStaffId', async () => {
    const mockRequests = [
      { Request_ID: 1, Current_Status: 'Pending', Staff_ID: 150118 },
      { Request_ID: 2, Current_Status: 'Approved', Staff_ID: 150119 },
    ];
    mockQuery.mockResolvedValueOnce({ rows: mockRequests });

    const result = await getRequests('150118');
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['150118']);
    expect(result).toEqual(mockRequests);
  });

  test('should throw an error if query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Database error'));
    await expect(getRequests('150118')).rejects.toThrow('Database error');
  });
});

describe('withdrawRequestService', () => {
  test('should withdraw a request if it exists', async () => {
    mockQuery.mockResolvedValueOnce({ rowCount: 1 });

    const result = await withdrawRequestService(1, '150118', 'Valid reason');
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [1, '150118', 'Valid reason']);
    expect(result.rowCount).toBe(1);
  });

  test('should throw an error if query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Database error'));
    await expect(withdrawRequestService(1, '150118', 'Valid reason')).rejects.toThrow('Database error');
  });
});
describe('getPendingRequestCount', () => {
  test('should return the pending request count for a managerStaffId', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ pending_count: '5' }] });

    const result = await getPendingRequestCount('150118');
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['150118']);
    expect(result).toBe(5);
  });

  test('should throw an error if query fails', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Database error'));
    await expect(getPendingRequestCount('150118')).rejects.toThrow('Database error');
  });
});

});
