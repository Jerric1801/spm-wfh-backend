import { getScheduleService } from "../../src/services/viewSchedule/viewScheduleService";
import pool from "../../src/config/db";
// import getUserDetails from "../../src/shared/userDetails";
import { UserPayload } from "../../src/services/auth/authService";

jest.mock("../../src/config/db");
jest.mock("../../src/shared/userDetails");

const mockQuery = pool.query as jest.Mock;
// const mockGetUserDetails = getUserDetails as jest.Mock;


describe("getScheduleService", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return schedule of all staff in company for user 1 without filters", async () => {
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

  test("should be able to handle multiple dates", async () => {
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
});
