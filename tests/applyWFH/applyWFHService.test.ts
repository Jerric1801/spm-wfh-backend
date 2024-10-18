import {
  applyForWorkFromHome,
  WorkFromHomeRequest,
} from "../../src/services/applyWFH/applyWFHService";
import pool from "../../src/config/db";

jest.mock("../../src/config/db"); // Mock the db pool

const mockQuery = pool.query as jest.Mock;

describe("applyForWorkFromHome", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();  // Restore original implementations after each test
});

  test("with valid inputs, successfully apply WFH (test 1)", async () => {

    const mockRequestId = { rows: [{ Request_ID: 1 }] };

    mockQuery
      .mockResolvedValueOnce({}) // Mock sequence setting query 1
      .mockResolvedValueOnce({}) // Mock sequence setting query 2
      .mockResolvedValueOnce(mockRequestId) // Mock the generation of Request_ID
      .mockResolvedValueOnce({rowCount : 1}) // Mock insertion into Request table
      .mockResolvedValueOnce({rowCount: 3}); // Mock insertion into RequestDetails table

    const request: WorkFromHomeRequest = {
      Staff_ID: 123,
      dateRange: { startDate: "2024-10-01", endDate: "2024-10-03" },
      wfhType: "AM",
      reason: "Personal reasons",
    };

    const result = await applyForWorkFromHome(request);

    expect(mockQuery).toHaveBeenCalledTimes(5); // Ensure all queries are called
    expect(result.details).toHaveLength(3); // There should be 3 dates (Oct 1, 2, 3)
    expect(result.details).toEqual([
      { Request_ID: 1, Date: "2024-10-01", WFH_Type: "AM" },
      { Request_ID: 1, Date: "2024-10-02", WFH_Type: "AM" },
      { Request_ID: 1, Date: "2024-10-03", WFH_Type: "AM" },
    ]);
  });



  it("should generate correct dates for a single day request", async () => {
    const mockRequestId = { rows: [{ Request_ID: 2 }] };

    mockQuery
      .mockResolvedValueOnce({}) // Mock sequence setting query 1
      .mockResolvedValueOnce({}) // Mock sequence setting query 2
      .mockResolvedValueOnce(mockRequestId) // Mock the generation of Request_ID
      .mockResolvedValueOnce({ rowCount: 1 }) // Mock insertion into Request table
      .mockResolvedValueOnce({ rowCount: 1 }); // Mock insertion into RequestDetails table

    const request: WorkFromHomeRequest = {
      Staff_ID: 123,
      dateRange: { startDate: "2024-10-05", endDate: "2024-10-05" },
      wfhType: "PM",
      reason: "Medical appointment",
    };

    const result = await applyForWorkFromHome(request);

    expect(mockQuery).toHaveBeenCalledTimes(5);
    expect(result.details).toHaveLength(1); // Only one date in range
    expect(result.details).toEqual([
      { Request_ID: 2, Date: "2024-10-05", WFH_Type: "PM" },
    ]);
  });

  it("should handle a long date range for work-from-home request (Test 10)", async () => {
    const mockRequestId = { rows: [{ Request_ID: 3 }] }; // Mock returning a Request_ID

    mockQuery
      .mockResolvedValueOnce({}) // Mock sequence setting query 1
      .mockResolvedValueOnce({}) // Mock sequence setting query 2
      .mockResolvedValueOnce(mockRequestId) // Mock the generation of Request_ID
      .mockResolvedValueOnce({ rowCount: 1 }) // Mock successful insertion into Request table
      .mockResolvedValueOnce({ rowCount: 365 }); // Mock successful insertion into RequestDetails table for 365 days

    const request: WorkFromHomeRequest = {
      Staff_ID: 123,
      dateRange: { startDate: "2024-01-01", endDate: "2024-12-31" },
      wfhType: "WD",
      reason: "Year-long project",
    };

    const result = await applyForWorkFromHome(request);

    expect(pool.query).toHaveBeenCalledTimes(5);
    expect(result.details).toHaveLength(366); // Each day in 2024
    expect(result.details[0]).toEqual({
      Request_ID: 3,
      Date: "2024-01-01",
      WFH_Type: "WD",
    });
    expect(result.details[365]).toEqual({
      Request_ID: 3,
      Date: "2024-12-31",
      WFH_Type: "WD",
    });
  });

  it("should handle database errors gracefully", async () => {
    // Mock the pool.query method to throw an error
    mockQuery.mockRejectedValueOnce(new Error("Database connection error"));

    const request: WorkFromHomeRequest = {
      Staff_ID: 123,
      dateRange: { startDate: "2024-10-01", endDate: "2024-10-03" },
      wfhType: "AM",
      reason: "Personal reasons",
    };

    await expect(applyForWorkFromHome(request)).rejects.toThrow(
      "Database connection error"
    );
    expect(pool.query).toHaveBeenCalledTimes(1); // Ensure query was called before error
  });
});
