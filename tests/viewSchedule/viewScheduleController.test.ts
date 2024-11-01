import { viewSchedule } from "../../src/services/viewSchedule/viewScheduleController";
import { getScheduleService } from "../../src/services/viewSchedule/viewScheduleService";
import { Request, Response } from "express";
import { UserPayload } from "../../src/services/auth/authService";

interface AuthenticatedRequest extends Request {
  user?: UserPayload; // Use the defined `UserPayload` type
}

jest.mock("../../src/services/viewSchedule/viewScheduleService");
const mockGetScheduleService = getScheduleService as jest.Mock;

describe("viewScheduleController", () => {
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
    jest.restoreAllMocks(); // Restore original implementations after each test
  });

  test("should return 200 and the schedule if valid input is provided", async () => {
    req.user = { 
        Staff_ID: 1, 
        Role: "1", 
        Staff_FName: "Jerric", 
        Staff_LName: "Chan", 
        Dept: "HR", 
        Email: "jerric.chan@allinone.com", 
        Country: "Singapore", 
        Position: "Manager" 
    };
    req.query = { startDate: "2023-01-01", endDate: "2023-01-31" };

    const mockSchedule = [
        {
            date: "2023-01-01",
            departments: [
                {
                    department: "dept",
                    teams: [
                        {
                            team: "role",
                            members: [
                                {
                                    staffId: "123",
                                    Staff_FName: "John",
                                    Staff_LName: "Doe",
                                    WFH_Type: "IN",
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ];
    
    mockGetScheduleService.mockReturnValue({
        getSchedule: jest.fn().mockResolvedValue(mockSchedule),
    });

    await viewSchedule(req as AuthenticatedRequest, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(mockSchedule);
});


  test("should return 400 if startDate or endDate is missing", async () => {
    req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
    req.query = { startDate: "2023-01-01" }; // Missing endDate

    await viewSchedule(req as AuthenticatedRequest, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Start date and end date are required",
    });
  });

  test("should return 400 if startDate is in the wrong format", async () => {
    req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
    req.query = { startDate: "wrong-format", endDate: "2023-01-31" };

    await viewSchedule(req as AuthenticatedRequest, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Invalid date format for startDate",
    });
  });

  test("should return 400 if endDate is in the wrong format", async () => {
    req.query = { startDate: "2023-01-01", endDate: "wrong-format" };
    req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };

    await viewSchedule(req as AuthenticatedRequest, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Invalid date format for endDate",
    });
  });

  test("should return 400 if startDate is after endDate", async () => {
    req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
    req.query = { startDate: "2023-02-01", endDate: "2023-01-01" }; // startDate is after endDate

    await viewSchedule(req as AuthenticatedRequest, res as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Start date must be before or equal to end date",
    });
  });

  test("should return 500 if viewScheduleService throws an error", async () => {
    req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
    req.query = { startDate: "2023-01-01", endDate: "2023-01-31" };

    mockGetScheduleService.mockReturnValue({
      getSchedule: jest.fn().mockRejectedValue(new Error("Database error")),
    });

    await viewSchedule(req as AuthenticatedRequest, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "An error occurred while fetching the schedule",
    });
  });
});
