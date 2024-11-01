import { getScheduleService } from "../../src/services/viewSchedule/viewScheduleService";
import pool from "../../src/config/db";
import getUserDetails from "../../src/shared/userDetails";
import { UserPayload } from "../../src/services/auth/authService";

jest.mock("../../src/config/db");
jest.mock("../../src/shared/userDetails");

const mockQuery = pool.query as jest.Mock;
const mockGetUserDetails = getUserDetails as jest.Mock;

describe("getScheduleService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("Should return an instance of HRScheduleService when user role is 1", () => {
    const mockUser: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "jerric.chan@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const service = getScheduleService(mockUser);
    expect(service.constructor.name).toBe("HRScheduleService");
  });

  test("Should return an instance of EmployeeScheduleService when user role is 2", () => {
    const mockUser: UserPayload = {
      Staff_ID: 1,
      Role: "2",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "jerric.chan@allinone.com",
      Country: "Singapore",
      Position: "HR Executive",
    };
    const service = getScheduleService(mockUser);
    expect(service.constructor.name).toBe("EmployeeScheduleService");
  });

  test("Should return an instance of ManagerScheduleService when user role is 3", () => {
    const mockUser: UserPayload = {
      Staff_ID: 1,
      Role: "3",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "jerric.chan@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const service = getScheduleService(mockUser);
    expect(service.constructor.name).toBe("ManagerScheduleService");
  });

  test("Should accurately return varied schedule of all staff in company for Role 1", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "jerric.chan@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2023-10-01";
    const endDate = "2023-10-01";

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Staff_FName: "Jerric",
          Staff_LName: "Chan",
          Dept: "HR",
          Position: "Manager",
        },
        {
          Staff_ID: "2",
          Staff_FName: "John",
          Staff_LName: "Doe",
          Dept: "HR",
          Position: "Manager",
        },
        {
          Staff_ID: "3",
          Staff_FName: "Jane",
          Staff_LName: "Smith",
          Dept: "Finance",
          Position: "Analyst",
        },
      ],
    });

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "2",
          Date: "2023-10-01",
          WFH_Type: "AM",
        },
        {
          Staff_ID: "3",
          Date: "2023-10-01",
          WFH_Type: "PM",
        },
      ],
    });

    const scheduleService = getScheduleService(user);
    const result = await scheduleService.getSchedule(startDate, endDate);

    expect(result).toEqual([
      {
        date: "2023-10-01",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "IN",
                  },
                  {
                    staffId: "2",
                    Staff_FName: "John",
                    Staff_LName: "Doe",
                    WFH_Type: "AM",
                  },
                ],
              },
            ],
          },
          {
            department: "Finance",
            teams: [
              {
                team: "Analyst",
                members: [
                  {
                    staffId: "3",
                    Staff_FName: "Jane",
                    Staff_LName: "Smith",
                    WFH_Type: "PM",
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(mockQuery).toHaveBeenCalledTimes(2); // First for fetching employees, second for WFH requests
  });

  test("Should accurately return varied schedule of self, reporting manager and peers for Role 2", async () => {
    const user: UserPayload = {
      Staff_ID: 41,
      Role: "2",
      Staff_FName: "Martyn",
      Staff_LName: "Tok",
      Dept: "Engineering",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Junior Engineers",
    };
    const startDate = "2024-11-01";
    const endDate = "2024-11-01";

    mockGetUserDetails.mockResolvedValueOnce({
      reportingManager: "4",
      Position: "Junior Engineers",
    });

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "4",
          Staff_FName: "Jerric",
          Staff_LName: "Chan",
          Dept: "Engineering",
          Position: "Manager",
        },
        {
          Staff_ID: "41",
          Staff_FName: "Martyn",
          Staff_LName: "Tok",
          Dept: "Engineering",
          Position: "Junior Engineers",
        },
        {
          Staff_ID: "42",
          Staff_FName: "Ethan",
          Staff_LName: "Tay",
          Dept: "Engineering",
          Position: "Junior Engineers",
        },
      ],
    });

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "4",
          Date: "2024-11-01",
          WFH_Type: "AM",
        },
        {
          Staff_ID: "42",
          Date: "2024-11-01",
          WFH_Type: "PM",
        },
      ],
    });

    const scheduleService = getScheduleService(user);
    const result = await scheduleService.getSchedule(startDate, endDate);

    expect(result).toEqual([
      {
        date: "2024-11-01",
        departments: [
          {
            department: "Engineering",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "4",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "AM",
                  },
                ],
              },
              {
                team: "Junior Engineers",
                members: [
                  {
                    staffId: "41",
                    Staff_FName: "Martyn",
                    Staff_LName: "Tok",
                    WFH_Type: "IN",
                  },
                  {
                    staffId: "42",
                    Staff_FName: "Ethan",
                    Staff_LName: "Tay",
                    WFH_Type: "PM",
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(mockGetUserDetails).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  });

  test("Should accurately return varied schedule for self, subordinates, peers, and reporting manager for Role 3", async () => {
    const user: UserPayload = {
      Staff_ID: 50,
      Role: "3",
      Staff_FName: "Chris",
      Staff_LName: "Lee",
      Dept: "Marketing",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2024-11-01";
    const endDate = "2024-11-01";

    // Mock getUserDetails to provide reporting manager information
    mockGetUserDetails.mockResolvedValueOnce({
      reportingManager: "5",
      Position: "Manager",
    });

    // Mock fetching subordinates
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "501",
          Staff_FName: "Alice",
          Staff_LName: "Johnson",
          Dept: "Marketing",
          Position: "Executive",
          Reporting_Manager: "4",
        },
      ],
    });

    // Mock fetching peers
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "50",
          Staff_FName: "Chris",
          Staff_LName: "Lee",
          Dept: "Marketing",
          Position: "Manager",
          Reporting_Manager: "10",
        },
        {
          Staff_ID: "51",
          Staff_FName: "Bob",
          Staff_LName: "Smith",
          Dept: "Marketing",
          Position: "Manager",
          Reporting_Manager: "10",
        },
        {
          Staff_ID: "5",
          Staff_FName: "Zara",
          Staff_LName: "Mufti",
          Dept: "Marketing",
          Position: "General Manager",
          Reporting_Manager: "1",
        },
      ],
    });

    // Mock fetching WFH requests
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "501",
          Date: "2024-11-01",
          WFH_Type: "AM",
        },
        {
          Staff_ID: "51",
          Date: "2024-11-01",
          WFH_Type: "PM",
        },
      ],
    });

    const scheduleService = getScheduleService(user);
    const result = await scheduleService.getSchedule(startDate, endDate);

    expect(result).toEqual([
      {
        date: "2024-11-01",
        departments: [
          {
            department: "Marketing",
            teams: [
              {
                team: "Executive",
                members: [
                  {
                    staffId: "501",
                    Staff_FName: "Alice",
                    Staff_LName: "Johnson",
                    WFH_Type: "AM",
                  },
                ],
              },
              {
                team: "Manager",
                members: [
                  {
                    staffId: "50",
                    Staff_FName: "Chris",
                    Staff_LName: "Lee",
                    WFH_Type: "IN",
                  },
                  {
                    staffId: "51",
                    Staff_FName: "Bob",
                    Staff_LName: "Smith",
                    WFH_Type: "PM",
                  },
                ],
              },
              {
                team: "General Manager",
                members: [
                  {
                    staffId: "5",
                    Staff_FName: "Zara",
                    Staff_LName: "Mufti",
                    WFH_Type: "IN",
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(mockGetUserDetails).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledTimes(3); // First for subordinates, second for peers, third for WFH requests
  });

  test("Should return 'IN' for all staff if no WFH queries have been found for date range", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2023-10-01";
    const endDate = "2023-10-01";

    // Mock fetching employees
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Staff_FName: "Jerric",
          Staff_LName: "Chan",
          Dept: "HR",
          Position: "Manager",
        },
        {
          Staff_ID: "2",
          Staff_FName: "John",
          Staff_LName: "Doe",
          Dept: "HR",
          Position: "Manager",
        },
        {
          Staff_ID: "3",
          Staff_FName: "Jane",
          Staff_LName: "Smith",
          Dept: "Finance",
          Position: "Analyst",
        },
      ],
    });

    // Mock fetching WFH requests (empty for this test case)
    mockQuery.mockResolvedValueOnce({
      rows: [],
    });

    const scheduleService = getScheduleService(user);
    const result = await scheduleService.getSchedule(startDate, endDate);

    expect(result).toEqual([
      {
        date: "2023-10-01",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "IN",
                  },
                  {
                    staffId: "2",
                    Staff_FName: "John",
                    Staff_LName: "Doe",
                    WFH_Type: "IN",
                  },
                ],
              },
            ],
          },
          {
            department: "Finance",
            teams: [
              {
                team: "Analyst",
                members: [
                  {
                    staffId: "3",
                    Staff_FName: "Jane",
                    Staff_LName: "Smith",
                    WFH_Type: "IN",
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(mockQuery).toHaveBeenCalledTimes(2); // First for fetching employees, second for WFH requests
  });

  test("Should be able to handle multiple dates in a query", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2023-10-01";
    const endDate = "2023-10-03";

    // Mock fetching employees
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Staff_FName: "Jerric",
          Staff_LName: "Chan",
          Dept: "HR",
          Position: "Manager",
        },
      ],
    });

    // Mock fetching WFH requests
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Date: "2023-10-01",
          WFH_Type: "AM",
        },
        {
          Staff_ID: "1",
          Date: "2023-10-03",
          WFH_Type: "PM",
        },
      ],
    });

    const scheduleService = getScheduleService(user);
    const result = await scheduleService.getSchedule(startDate, endDate);

    expect(result).toEqual([
      {
        date: "2023-10-01",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "AM",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        date: "2023-10-02",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "IN",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        date: "2023-10-03",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "PM",
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(mockQuery).toHaveBeenCalledTimes(2); // First for fetching employees, second for WFH requests
  });

  test("Should be able to handle dates across months and years in a query", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2024-12-31";
    const endDate = "2025-01-01";

    // Mock fetching employees
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Staff_FName: "Jerric",
          Staff_LName: "Chan",
          Dept: "HR",
          Position: "Manager",
        },
      ],
    });

    // Mock fetching WFH requests
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Date: "2024-12-31",
          WFH_Type: "AM",
        },
      ],
    });

    const scheduleService = getScheduleService(user);
    const result = await scheduleService.getSchedule(startDate, endDate);

    expect(result).toEqual([
      {
        date: "2024-12-31",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "AM",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        date: "2025-01-01",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "IN",
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(mockQuery).toHaveBeenCalledTimes(2); // First for fetching employees, second for WFH requests
  });

  test("Should be able to handle leap dates in a query", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2024-02-28";
    const endDate = "2024-03-01";

    // Mock fetching employees
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Staff_FName: "Jerric",
          Staff_LName: "Chan",
          Dept: "HR",
          Position: "Manager",
        },
      ],
    });

    // Mock fetching WFH requests
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Date: "2024-02-28",
          WFH_Type: "AM",
        },
      ],
    });

    const scheduleService = getScheduleService(user);
    const result = await scheduleService.getSchedule(startDate, endDate);

    expect(result).toEqual([
      {
        date: "2024-02-28",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "AM",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        date: "2024-02-29",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "IN",
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        date: "2024-03-01",
        departments: [
          {
            department: "HR",
            teams: [
              {
                team: "Manager",
                members: [
                  {
                    staffId: "1",
                    Staff_FName: "Jerric",
                    Staff_LName: "Chan",
                    WFH_Type: "IN",
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);

    expect(mockQuery).toHaveBeenCalledTimes(2); // First for fetching employees, second for WFH requests
  });

  test("Should handle database query failure gracefully when querying for Role 1", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2024-11-01";
    const endDate = "2024-11-01";
    const service = getScheduleService(user);

    mockQuery.mockRejectedValue(new Error("Database query failed"));

    await expect(service.getSchedule(startDate, endDate)).rejects.toThrow(
      "Unable to retrieve schedule. Error: Unable to fetch employees from the database."
    );
  });

  test("Should handle database query failure gracefully when querying for Role 2", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "2",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "Engineering",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2024-11-01";
    const endDate = "2024-11-01";
    const service = getScheduleService(user);

    mockQuery.mockRejectedValue(new Error("Database query failed"));

    await expect(service.getSchedule(startDate, endDate)).rejects.toThrow(
      "Unable to retrieve schedule. Error: Unable to fetch employees from the database."
    );
  });

  test("Should handle database query failure gracefully when querying for Role 3 subordinates", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "3",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "Engineering",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Junior Engineer",
    };
    const startDate = "2024-11-01";
    const endDate = "2024-11-01";
    const service = getScheduleService(user);

    mockQuery.mockRejectedValue(new Error("Database query failed"));

    await expect(service.getSchedule(startDate, endDate)).rejects.toThrow(
      "Unable to retrieve schedule. Error: Unable to fetch employees from the database. Error: Unable to fetch subordinates from the database."
    );
  });

  test("Should handle database query failure gracefully when querying for Role 3 reporting manager and peers", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "3",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "Engineering",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2024-11-01";
    const endDate = "2024-11-01";
    const service = getScheduleService(user);

    mockGetUserDetails.mockResolvedValueOnce({
      reportingManager: "5",
      Position: "Manager",
    });

    // Mock fetching subordinates success
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "501",
          Staff_FName: "Alice",
          Staff_LName: "Johnson",
          Dept: "Marketing",
          Position: "Executive",
          Reporting_Manager: "4",
        },
      ],
    });
    mockQuery.mockRejectedValue(new Error("Database query failed"));

    await expect(service.getSchedule(startDate, endDate)).rejects.toThrow(
      "Unable to retrieve schedule. Error: Unable to fetch employees from the database. Error: Unable to fetch peers and reporting manager from the database."
    );
  });

  test("Should handle database query failure gracefully when querying for WFH records", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
      Email: "example@allinone.com",
      Country: "Singapore",
      Position: "Manager",
    };
    const startDate = "2024-11-01";
    const endDate = "2024-11-01";
    const service = getScheduleService(user);
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Staff_FName: "Jerric",
          Staff_LName: "Chan",
          Dept: "HR",
          Position: "Manager",
        },
        {
          Staff_ID: "2",
          Staff_FName: "John",
          Staff_LName: "Doe",
          Dept: "HR",
          Position: "Manager",
        },
      ],
    });

    mockQuery.mockRejectedValue(new Error("Database query failed"));

    await expect(service.getSchedule(startDate, endDate)).rejects.toThrow(
      "Unable to retrieve schedule. Error: Unable to fetch WFH requests from the database."
    );
  });
});
