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

  test("Return schedule of all staff in company for Role 1", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
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

    expect(result).toEqual({
      "2023-10-01": {
        HR: {
          Manager: {
            "1": {
              staffId: "1",
              firstName: "Jerric",
              lastName: "Chan",
              wfhType: "IN",
            },
            "2": {
              staffId: "2",
              firstName: "John",
              lastName: "Doe",
              wfhType: "AM",
            },
          },
        },
        Finance: {
          Analyst: {
            "3": {
              staffId: "3",
              firstName: "Jane",
              lastName: "Smith",
              wfhType: "PM",
            },
          },
        },
      },
    });

    expect(mockQuery).toHaveBeenCalledTimes(2);  // First for fetching employees, second for WFH requests
  });

  test("Return schedule of self, reporting manager and peers for Role 2", async () => {
    const user: UserPayload = {
      Staff_ID: 41,
      Role: "2",
      Staff_FName: "Martyn",
      Staff_LName: "Tok",
      Dept: "Engineering",
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

    expect(result).toEqual({
      "2024-11-01": {
        "Engineering": {
          "Manager": {
            "4": {
              staffId: "4",
              firstName: "Jerric",
              lastName: "Chan",
              wfhType: "AM",
            },
          },
          "Junior Engineers": {
            "41": {
              staffId: "41",
              firstName: "Martyn",
              lastName: "Tok",
              wfhType: "IN",
            },
            "42": {
              staffId: "42",
              firstName: "Ethan",
              lastName: "Tay",
              wfhType: "PM",
            },
          },
        },
      },
    });

    expect(mockGetUserDetails).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledTimes(2);
  })

  test("Should be able to handle multiple dates", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
    };
    const startDate = "2023-10-01";
    const endDate = "2023-10-03";

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

    expect(result).toEqual({
      "2023-10-01": {
        HR: {
          Manager: {
            "1": {
              staffId: "1",
              firstName: "Jerric",
              lastName: "Chan",
              wfhType: "AM",
            },
          },
        },
      },
      "2023-10-02": {
        HR: {
          Manager: {
            "1": {
              staffId: "1",
              firstName: "Jerric",
              lastName: "Chan",
              wfhType: "IN",
            },
          },
        },
      },
      "2023-10-03": {
        HR: {
          Manager: {
            "1": {
              staffId: "1",
              firstName: "Jerric",
              lastName: "Chan",
              wfhType: "PM",
            },
          },
        },
      },
    });
  });

  test("Should be able to handle dates across months", async () => {
    const user: UserPayload = {
      Staff_ID: 1,
      Role: "1",
      Staff_FName: "Jerric",
      Staff_LName: "Chan",
      Dept: "HR",
    };
    const startDate = "2024-10-31";
    const endDate = "2024-11-01";

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

    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          Staff_ID: "1",
          Date: "2024-10-31",
          WFH_Type: "AM",
        },
      ],
    });

    const scheduleService = getScheduleService(user);
    const result = await scheduleService.getSchedule(startDate, endDate);

    expect(result).toEqual({
      "2024-10-31": {
        HR: {
          Manager: {
            "1": {
              staffId: "1",
              firstName: "Jerric",
              lastName: "Chan",
              wfhType: "AM",
            },
          },
        },
      },
      "2024-11-01": {
        HR: {
          Manager: {
            "1": {
              staffId: "1",
              firstName: "Jerric",
              lastName: "Chan",
              wfhType: "IN",
            },
          },
        },
      },
    });
  });
});
