import { requestWorkFromHome } from '../../src/services/applyWFH/applyWFHController';
import { applyForWorkFromHome } from '../../src/services/applyWFH/applyWFHService';
import { Request, Response } from 'express';
import { UserPayload } from '../../src/services/auth/authService';

// Mock the service method
jest.mock('../../src/services/applyWFH/applyWFHService');

const mockApplyForWorkFromHome = applyForWorkFromHome as jest.Mock;

interface AuthenticatedRequest extends Request {
    user?: UserPayload;
}

describe('requestWorkFromHome Controller Tests', () => {
    let req: Partial<AuthenticatedRequest>;
    let res: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        statusMock = jest.fn().mockReturnThis();  // Mocks res.status().json() chain
        jsonMock = jest.fn();                     // Mocks res.json()
        req = {};                                 // Initialize request
        res = { status: statusMock, json: jsonMock };  // Initialize response
    });

    afterEach(() => {
        jest.restoreAllMocks();  // Restore original implementations after each test
    });

    it('should return 400 if required fields are missing', async () => {
        req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
        req.body = {
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
        };

        await requestWorkFromHome(req as AuthenticatedRequest, res as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Please provide dateRange, recurringDays, wfhType, and reason.'
        });
    });

    it('should return 400 if wfhType is invalid', async () => {
        req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
        req.body = {
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
            recurringDays: ["Su","M","Tu","W","Th","F","Sa"],
            wfhType: 'INVALID_TYPE',
            reason: 'Doctor appointment',
        };

        await requestWorkFromHome(req as AuthenticatedRequest, res as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Invalid work-from-home type. Must be one of AM, PM, or WD.'
        });
    });

    it('should return 400 if endDate is before startDate', async () => {
        req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
        req.body = {
            dateRange: { startDate: '2024-10-20', endDate: '2024-10-14' },
            recurringDays: ["Su","M","Tu","W","Th","F","Sa"],
            wfhType: 'AM',
            reason: 'Doctor appointment',
        };

        await requestWorkFromHome(req as AuthenticatedRequest, res as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'The end date must be the same or after the start date.'
        });
    });

    it('should call applyForWorkFromHome and return 200 on successful request', async () => {
        req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
        req.body = {
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
            recurringDays: ["Su","M","Tu","W","Th","F","Sa"],
            wfhType: 'AM',
            reason: 'Doctor appointment',
        };

        const mockResult = {
            details: [
                { Request_ID: 1, Date: '2024-10-14', WFH_Type: 'AM' },
                { Request_ID: 1, Date: '2024-10-15', WFH_Type: 'AM' },
                { Request_ID: 1, Date: '2024-10-16', WFH_Type: 'AM' },
            ]
        };
        mockApplyForWorkFromHome.mockResolvedValue(mockResult);

        await requestWorkFromHome(req as AuthenticatedRequest, res as Response);

        expect(mockApplyForWorkFromHome).toHaveBeenCalledWith({
            Staff_ID: 1,
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
            recurringDays: ["Su","M","Tu","W","Th","F","Sa"],
            wfhType: 'AM',
            reason: 'Doctor appointment',
        });
        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Work-from-home request submitted successfully',
            data: mockResult,
        });
    });

    it('should return 500 if an error occurs in the service', async () => {
        req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
        req.body = {
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
            recurringDays: ["Su","M","Tu","W","Th","F","Sa"],
            wfhType: 'AM',
            reason: 'Doctor appointment',
        };

        mockApplyForWorkFromHome.mockRejectedValue(new Error('Service failure'));

        await requestWorkFromHome(req as AuthenticatedRequest, res as Response);

        expect(statusMock).toHaveBeenCalledWith(500);
        expect(jsonMock).toHaveBeenCalledWith({
            error: 'Internal Server Error'
        });
    });

    it('Should return 400 if invalid day is given for recurring days', async () => {
        req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
        req.body = {
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
            recurringDays: ["Sun"],
            wfhType: 'AM',
            reason: 'Doctor appointment',
        }

        await requestWorkFromHome(req as AuthenticatedRequest, res as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Only provide valid days of the week.'
        });
    })

    test("should return 409 if no suitable dates are found", async () => {
        req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
        req.body = {
            dateRange: { startDate: "2025-01-01", endDate: "2025-01-31" },
            recurringDays: ["M", "W", "F"],
            wfhType: "AM",
            reason: "Personal"
        };

        // Simulate no suitable dates error
        mockApplyForWorkFromHome.mockRejectedValue(new Error("No suitable dates found."));

        await requestWorkFromHome(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(jsonMock).toHaveBeenCalledWith({
            error: "No suitable dates found. Please choose a different date range or weekday."
        });
    });

    test("should return 409 if there are conflicting request dates", async () => {
        req.user = { Staff_ID: 1, Role: "1", Staff_FName: "Jerric", Staff_LName: "Chan", Dept: "HR", Email: "jerric.chan@allinone.com", Country: "Singapore", Position: "Manager" };
        req.body = {
            dateRange: { startDate: "2025-01-01", endDate: "2025-01-31" },
            recurringDays: ["M", "W", "F"],
            wfhType: "AM",
            reason: "Personal"
        };

        // Simulate conflicting request dates error
        mockApplyForWorkFromHome.mockRejectedValue(new Error("Conflicting request dates found."));

        await requestWorkFromHome(req as Request, res as Response);

        expect(statusMock).toHaveBeenCalledWith(409);
        expect(jsonMock).toHaveBeenCalledWith({
            error: "Conflicting request dates found. Please choose a different date range."
        });
    });
});
