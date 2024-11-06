import {
  applyForWorkFromHome,
  WorkFromHomeRequest,
} from "../../src/services/applyWFH/applyWFHService";
import pool from "../../src/config/db";
import { parseISO } from 'date-fns';
import { sendEmail } from '../../src/shared/sendEmail'; // Import sendEmail to mock

jest.mock("../../src/config/db"); // Mock the db pool
jest.mock('../../src/shared/sendEmail'); // Mock sendEmail

const mockQuery = pool.query as jest.Mock;
const mockSendEmail = sendEmail as jest.Mock;

describe("applyForWorkFromHome", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockSendEmail.mockResolvedValue(undefined); // Default: Mock sendEmail as successfully resolved
  });

  afterEach(() => {
    jest.restoreAllMocks();  // Restore original implementations after each test
  });

  //////////

  test("with valid inputs, successfully apply WFH", async () => {

    const mockRequestId = { rows: [{ Request_ID: 1 }] };
    const mockManagerQueryResult = { rows: [{ Reporting_Manager: "123" }] };
    const mockManagerDetailsResult = { rows: [{ Staff_FName: "John", Staff_LName: "Doe", Email: "john.doe@example.com" }] };

    mockQuery
      .mockResolvedValueOnce({}) // Mock selection of current existing Request_IDs
      .mockResolvedValueOnce({}) // Mock sequence setting query 1
      .mockResolvedValueOnce({}) // Mock sequence setting query 2
      .mockResolvedValueOnce(mockRequestId) // Mock the generation of Request_ID
      .mockResolvedValueOnce({ rowCount: 1 }) // Mock insertion into Request table
      .mockResolvedValueOnce({ rowCount: 3 }) // Mock insertion into RequestDetails table
      .mockResolvedValueOnce(mockManagerQueryResult) // Mock manager query
      .mockResolvedValueOnce(mockManagerDetailsResult); // Mock manager details query
    console.log(mockManagerQueryResult);
    const request: WorkFromHomeRequest = {
      Staff_ID: 123456,
      Dates: [parseISO("2024-10-01"), parseISO("2024-10-02"), parseISO("2024-10-03")], // Provide Dates array
      WFHType: "AM",
      WFHReason: "Personal reasons",
      Document: [],
    };


    const result = await applyForWorkFromHome(request);

    expect(mockQuery).toHaveBeenCalledTimes(8); // Ensure all queries are called
    expect(mockSendEmail).toHaveBeenCalled(); // Ensure sendEmail was called
    expect(result.details).toHaveLength(3); // There should be 3 dates (Oct 1, 2, 3)
    expect(result.details).toEqual([
      { Request_ID: 1, Date: "2024-10-01", WFH_Type: "AM" },
      { Request_ID: 1, Date: "2024-10-02", WFH_Type: "AM" },
      { Request_ID: 1, Date: "2024-10-03", WFH_Type: "AM" },
    ]);
  });

  //////////

  it("should generate correct dates for a single day request", async () => {
    const mockRequestId = { rows: [{ Request_ID: 2 }] };
    const mockCurrentRequestIds = { rows: [{ Request_ID: 1 }] };
    const mockManagerQueryResult = { rows: [{ Reporting_Manager: "123" }] };
    const mockManagerDetailsResult = { rows: [{ Staff_FName: "John", Staff_LName: "Doe", Email: "john.doe@example.com" }] };

    mockQuery
      .mockResolvedValueOnce(mockCurrentRequestIds) // Mock selection of current existing Request_IDs
      .mockResolvedValueOnce({}) // Mock selection of conflict dates
      .mockResolvedValueOnce({}) // Mock sequence setting query 1
      .mockResolvedValueOnce({}) // Mock sequence setting query 2
      .mockResolvedValueOnce(mockRequestId) // Mock the generation of Request_ID
      .mockResolvedValueOnce({ rowCount: 1 }) // Mock insertion into Request table
      .mockResolvedValueOnce({ rowCount: 1 }) // Mock insertion into RequestDetails table
      .mockResolvedValueOnce(mockManagerQueryResult) // Mock manager query
      .mockResolvedValueOnce(mockManagerDetailsResult); // Mock manager details query

    const request: WorkFromHomeRequest = {
      Staff_ID: 123456,
      Dates: [parseISO("2024-10-05")], // Provide Dates array
      WFHType: "PM",
      WFHReason: "Medical appointment",
      Document: [],
    };


    const result = await applyForWorkFromHome(request);

    expect(mockQuery).toHaveBeenCalledTimes(9);
    expect(mockSendEmail).toHaveBeenCalled(); // Ensure sendEmail was called
    expect(result.details).toHaveLength(1); // Only one date in range
    expect(result.details).toEqual([
      { Request_ID: 2, Date: "2024-10-05", WFH_Type: "PM" },
    ]);
  });

  //////////

  it("should generate correct dates for recurring days in a request", async () => {
    const mockRequestId = { rows: [{ Request_ID: 3 }] };
    const mockCurrentRequestIds = { rows: [{ Request_ID: 1 }] };
    const mockManagerQueryResult = { rows: [{ Reporting_Manager: "123" }] };
    const mockManagerDetailsResult = { rows: [{ Staff_FName: "John", Staff_LName: "Doe", Email: "john.doe@example.com" }] };

    mockQuery
      .mockResolvedValueOnce(mockCurrentRequestIds) // Mock selection of current existing Request_IDs
      .mockResolvedValueOnce({}) // Mock selection of conflict dates
      .mockResolvedValueOnce({}) // Mock sequence setting query 1
      .mockResolvedValueOnce({}) // Mock sequence setting query 2
      .mockResolvedValueOnce(mockRequestId) // Mock the generation of Request_ID
      .mockResolvedValueOnce({ rowCount: 1 }) // Mock insertion into Request table
      .mockResolvedValueOnce({ rowCount: 1 }) // Mock insertion into RequestDetails table
      .mockResolvedValueOnce(mockManagerQueryResult) // Mock manager query
      .mockResolvedValueOnce(mockManagerDetailsResult); // Mock manager details query

    const request: WorkFromHomeRequest = {
      Staff_ID: 123456,
      Dates: [parseISO("2024-10-08"), parseISO("2024-10-10"), parseISO("2024-10-15"), parseISO("2024-10-17")], // Provide Dates array
      WFHType: "AM",
      WFHReason: "Child CCA Performance",
      Document: []
    };


    const result = await applyForWorkFromHome(request);

    expect(mockQuery).toHaveBeenCalledTimes(9);
    expect(mockSendEmail).toHaveBeenCalled(); // Ensure sendEmail was called
    expect(result.details).toHaveLength(4); // Number of dates registered
    expect(result.details).toEqual([
      { Request_ID: 3, Date: "2024-10-08", WFH_Type: "AM" },
      { Request_ID: 3, Date: "2024-10-10", WFH_Type: "AM" },
      { Request_ID: 3, Date: "2024-10-15", WFH_Type: "AM" },
      { Request_ID: 3, Date: "2024-10-17", WFH_Type: "AM" },
    ]);
  });

  //////////

  it("should handle a long date range for work-from-home request", async () => {
    const mockRequestId = { rows: [{ Request_ID: 4 }] }; // Mock returning a Request_ID
    const mockCurrentRequestIds = { rows: [{ Request_ID: 1 }] };
    const mockManagerQueryResult = { rows: [{ Reporting_Manager: "123" }] };
    const mockManagerDetailsResult = { rows: [{ Staff_FName: "John", Staff_LName: "Doe", Email: "john.doe@example.com" }] };

    mockQuery
      .mockResolvedValueOnce(mockCurrentRequestIds) // Mock selection of current existing Request_IDs
      .mockResolvedValueOnce({}) // Mock selection of conflict dates
      .mockResolvedValueOnce({}) // Mock sequence setting query 1
      .mockResolvedValueOnce({}) // Mock sequence setting query 2
      .mockResolvedValueOnce(mockRequestId) // Mock the generation of Request_ID
      .mockResolvedValueOnce({ rowCount: 1 }) // Mock successful insertion into Request table
      .mockResolvedValueOnce({ rowCount: 4 }) // Mock successful insertion into RequestDetails table for 4 days over a long time period
      .mockResolvedValueOnce(mockManagerQueryResult) // Mock manager query
      .mockResolvedValueOnce(mockManagerDetailsResult); // Mock manager details query

    const request: WorkFromHomeRequest = {
      Staff_ID: 123456,
      Dates: [parseISO("2024-10-08"), parseISO("2024-11-10"), parseISO("2024-12-15"), parseISO("2025-01-17")], // Provide Dates array
      WFHType: "AM",
      WFHReason: "Child CCA Performance",
      Document: []
    };

    const result = await applyForWorkFromHome(request);

    expect(pool.query).toHaveBeenCalledTimes(9);
    expect(mockSendEmail).toHaveBeenCalled(); // Ensure sendEmail was called
    expect(result.details).toHaveLength(4); // Each day in 2024
    expect(result.details[0]).toEqual({
      Request_ID: 4,
      Date: "2024-10-08",
      WFH_Type: "AM",
    });
    expect(result.details[3]).toEqual({
      Request_ID: 4,
      Date: "2025-01-17",
      WFH_Type: "AM",
    });
  });

  //////////

  it("should reject work-from-home request if it conflicts with existing requests", async () => {
    const mockCurrentRequestIds = { rows: [{ Request_ID: 5 }] };
    const mockConflictDates = { rowCount: 20 };

    mockQuery
      .mockResolvedValueOnce(mockCurrentRequestIds) // Mock selection of current existing Request_IDs
      .mockResolvedValueOnce(mockConflictDates); // Mock selection of conflict dates

    const request: WorkFromHomeRequest = {
      Staff_ID: 123456,
      Dates: [parseISO("2024-10-08"), parseISO("2024-10-10"), parseISO("2024-10-15"), parseISO("2024-10-17")], // Provide Dates array
      WFHType: "AM",
      WFHReason: "Child CCA Performance",
      Document: []
    };

    await expect(applyForWorkFromHome(request)).rejects.toThrow("Conflicting request dates found.");
    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(mockSendEmail).not.toHaveBeenCalled(); // Ensure sendEmail was not called due to conflicts
  });

  //////////

  it("should handle database errors gracefully", async () => {
    // Mock the pool.query method to throw an error
    mockQuery.mockRejectedValueOnce(new Error("Database connection error"));

    const request: WorkFromHomeRequest = {
      Staff_ID: 123456,
      Dates: [parseISO("2024-10-08"), parseISO("2024-10-10"), parseISO("2024-10-15"), parseISO("2024-10-17")], // Provide Dates array
      WFHType: "AM",
      WFHReason: "Child CCA Performance",
      Document: []
    };

    await expect(applyForWorkFromHome(request)).rejects.toThrow(
      "Database connection error"
    );
    expect(pool.query).toHaveBeenCalledTimes(1); // Ensure query was called before error
    expect(mockSendEmail).not.toHaveBeenCalled(); // Ensure sendEmail was not called due to database error
  });
});