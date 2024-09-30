import { Client } from 'pg';
import {
  fetchRequestsByDate,
  fetchRequestsByDateApproved,
  fetchRequestsByDeptDate,
  fetchRequestsByWFHDetails,
  fetchEmployeesWFOByDate,
  countEmployeesWFOByDate,
  countEmployeesWFHByDate
} from '../modules/request';

jest.mock('pg', () => {
    const mClient = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn(),
    };
    return { Client: jest.fn(() => mClient) };
  });
  
  describe('Request Database Functions', () => {
    let client: any;
  
    beforeEach(() => {
      client = new Client();
      // Mock the query method to simulate an already connected client
      client.query.mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    });
  
    afterEach(() => {
      jest.clearAllMocks();
    });
  
    test('fetchRequestsByDate should return the correct data', async () => {
      const mockDate = '2024-11-06';
      const expectedRows = [
        {
          Request_ID: 2,
          Staff_ID: 151596,
          Dept: 'Finance',
          Current_Status: 'Approved',
          Created_At: new Date('2024-11-05T16:00:00.000Z'),
          Updated_At: new Date('2024-01-09T16:00:00.000Z'),
          Superviser_ID: 140879
        },
        {
          Request_ID: 36,
          Staff_ID: 151450,
          Dept: 'Solutioning',
          Current_Status: 'Rejected',
          Created_At: new Date('2024-11-05T16:00:00.000Z'),
          Updated_At: new Date('2024-03-14T16:00:00.000Z'),
          Superviser_ID: 171043
        }
      ];
  
      // Mock the query for fetchRequestsByDate
      client.query.mockResolvedValueOnce({ rows: expectedRows });
  
      const result = await fetchRequestsByDate(mockDate);
  
      expect(client.connect).not.toHaveBeenCalled(); // The client should not need to connect
      expect(client.query).toHaveBeenCalledTimes(2); // Once for the connection check, once for the actual query
      expect(client.query).toHaveBeenNthCalledWith(2,
        expect.stringContaining('SELECT * FROM public."Request"'),
        [mockDate]
      );
      expect(result).toEqual(expectedRows);
      expect(client.end).toHaveBeenCalledTimes(1);
    });
  
  //   test('fetchRequestsByDateApproved should return the correct data', async () => {
  //     const mockDate = '2024-08-08';
  //     const expectedRows = [
  //       {
  //         Request_ID: 4,
  //         Staff_ID: 140880,
  //         Dept: 'Engineering',
  //         Current_Status: 'Approved',
  //         Created_At: new Date('2024-06-06T16:00:00.000Z'),
  //         Updated_At: new Date('2024-02-03T16:00:00.000Z'),
  //         Superviser_ID: 180001,
  //         WFH_StartDate: new Date('2024-08-07T16:00:00.000Z'),
  //         WFH_EndDate: new Date('2024-08-02T16:00:00.000Z'),
  //         Type_WFH: 'AM'
  //       }
  //     ];
  
  //     client.query.mockResolvedValueOnce({ rows: expectedRows });
  
  //     const result = await fetchRequestsByDateApproved(mockDate);
  
  //     expect(client.connect).toHaveBeenCalledTimes(1);
  //     expect(client.query).toHaveBeenCalledWith(
  //       `SELECT r.*,w."WFH_StartDate", w."WFH_EndDate", w."Type_WFH" FROM public."Request" r LEFT JOIN public."RequestDetails" w ON r."Request_ID" = w."Request_ID" WHERE w."WFH_StartDate" = $1 AND r."Current_Status" = 'Approved' ORDER BY r."Request_ID" ASC;`,
  //       [mockDate]
  //     );
  //     expect(result).toEqual(expectedRows);
  //     expect(client.end).toHaveBeenCalledTimes(1);
  //   });
  
  //   test('fetchRequestsByDeptDate should return the correct data', async () => {
  //     const mockDept = 'Engineering';
  //     const mockDate = '2024-08-08';
  //     const mockStatus = 'Approved';
  //     const expectedRows = [
  //       {
  //         Request_ID: 4,
  //         Staff_ID: 140880,
  //         Dept: 'Engineering',
  //         Current_Status: 'Approved',
  //         Created_At: new Date('2024-06-06T16:00:00.000Z'),
  //         Updated_At: new Date('2024-02-03T16:00:00.000Z'),
  //         Superviser_ID: 180001,
  //         WFH_StartDate: new Date('2024-08-07T16:00:00.000Z'),
  //         WFH_EndDate: new Date('2024-08-02T16:00:00.000Z'),
  //         Type_WFH: 'AM'
  //       }
  //     ];
  
  //     client.query.mockResolvedValueOnce({ rows: expectedRows });
  
  //     const result = await fetchRequestsByDeptDate(mockDept, mockDate, mockStatus);
  
  //     expect(client.connect).toHaveBeenCalledTimes(1);
  //     expect(client.query).toHaveBeenCalledWith(
  //       `SELECT r.*,w."WFH_StartDate", w."WFH_EndDate", w."Type_WFH" FROM public."Request" r LEFT JOIN public."RequestDetails" w ON r."Request_ID" = w."Request_ID" WHERE r."Dept" = $1 AND w."WFH_StartDate" = $2 AND r."Current_Status" = $3 ORDER BY r."Request_ID" ASC;`,
  //       [mockDept, mockDate, mockStatus]
  //     );
  //     expect(result).toEqual(expectedRows);
  //     expect(client.end).toHaveBeenCalledTimes(1);
  //   });
  
  //   test('fetchRequestsByWFHDetails should return the correct data', async () => {
  //     const mockTypeWFH = 'AM';
  //     const mockStatus = 'Approved';
  //     const mockDate = '2024-12-21';
  //     const expectedRows = [
  //       {
  //         Request_ID: 39,
  //         Staff_ID: 190057,
  //         Dept: 'Engineering',
  //         Current_Status: 'Approved',
  //         Created_At: new Date('2024-09-27T16:00:00.000Z'),
  //         WFH_StartDate: new Date('2024-12-20T16:00:00.000Z'),
  //         WFH_EndDate: new Date('2024-01-21T16:00:00.000Z'),
  //         Type_WFH: 'AM'
  //       }
  //     ];
  
  //     client.query.mockResolvedValueOnce({ rows: expectedRows });
  
  //     const result = await fetchRequestsByWFHDetails(mockTypeWFH, mockStatus, mockDate);
  
  //     expect(client.connect).toHaveBeenCalledTimes(1);
  //     expect(client.query).toHaveBeenCalledWith(
  //       `SELECT r."Request_ID", r."Staff_ID", r."Dept", r."Current_Status", r."Created_At", w."WFH_StartDate", w."WFH_EndDate", w."Type_WFH" FROM public."Request" r JOIN public."RequestDetails" w ON r."Request_ID" = w."Request_ID" WHERE w."Type_WFH" = $1 AND r."Current_Status" = $2 AND w."WFH_StartDate" = $3 ORDER BY r."Request_ID" ASC;`,
  //       [mockTypeWFH, mockStatus, mockDate]
  //     );
  //     expect(result).toEqual(expectedRows);
  //     expect(client.end).toHaveBeenCalledTimes(1);
  //   });
  
  //   test('fetchEmployeesWFOByDate should return correct data for large result sets', async () => {
  //     const mockDate = '2024-10-01';
  //     const expectedRows = new Array(1000).fill({
  //       Staff_ID: 1,
  //       Staff_Name: 'Employee 1'
  //     });
  
  //     client.query.mockResolvedValueOnce({ rows: expectedRows });
  
  //     const result = await fetchEmployeesWFOByDate(mockDate);
  
  //     expect(client.connect).toHaveBeenCalledTimes(1);
  //     expect(client.query).toHaveBeenCalledWith(
  //       `SELECT e.* FROM public."Employees" e LEFT JOIN public."Request" r ON e."Staff_ID" = r."Staff_ID" LEFT JOIN public."RequestDetails" w ON r."Request_ID" = w."Request_ID" AND r."Current_Status" = 'Approved' AND w."WFH_StartDate" = $1 WHERE w."WFH_StartDate" IS NULL;`,
  //       [mockDate]
  //     );
  //     expect(result.length).toBe(expectedRows.length);
  //     expect(client.end).toHaveBeenCalledTimes(1);
  //   });
  
  //   test('countEmployeesWFOByDate should return the correct count', async () => {
  //     const mockDate = '2024-10-01';
  //     const expectedCount = { in_office_count: 559 };
  
  //     client.query.mockResolvedValueOnce({ rows: [expectedCount] });
  
  //     const result = await countEmployeesWFOByDate(mockDate);
  
  //     expect(client.connect).toHaveBeenCalledTimes(1);
  //     expect(client.query).toHaveBeenCalledWith(
  //       `SELECT COUNT(e."Staff_ID") AS "in_office_count" FROM public."Employees" e LEFT JOIN public."Request" r ON e."Staff_ID" = r."Staff_ID" LEFT JOIN public."RequestDetails" w ON r."Request_ID" = w."Request_ID" AND r."Current_Status" = 'Approved' AND w."WFH_StartDate" = $1 WHERE w."WFH_StartDate" IS NULL;`,
  //       [mockDate]
  //     );
  //     expect(result).toEqual(expectedCount);
  //     expect(client.end).toHaveBeenCalledTimes(1);
  //   });
  
  //   test('countEmployeesWFHByDate should return the correct count', async () => {
  //     const mockDate = '2024-10-01';
  //     const expectedCount = { wfh_count: 0 };
  
  //     client.query.mockResolvedValueOnce({ rows: [expectedCount] });
  
  //     const result = await countEmployeesWFHByDate(mockDate);
  
  //     expect(client.connect).toHaveBeenCalledTimes(1);
  //     expect(client.query).toHaveBeenCalledWith(
  //       `SELECT COUNT(e."Staff_ID") AS "wfh_count" FROM public."Employees" e LEFT JOIN public."Request" r ON e."Staff_ID" = r."Staff_ID" LEFT JOIN public."RequestDetails" w ON r."Request_ID" = w."Request_ID" WHERE r."Current_Status" = 'Approved' AND w."WFH_StartDate" = $1;`,
  //       [mockDate]
  //     );
  //     expect(result).toEqual(expectedCount);
  //     expect(client.end).toHaveBeenCalledTimes(1);
  //   });
  });