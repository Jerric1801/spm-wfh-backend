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
        req.body = {
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
        };

        await requestWorkFromHome(req as AuthenticatedRequest, res as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Please provide dateRange, wfhType, and reason.'
        });
    });

    it('should return 400 if wfhType is invalid', async () => {
        req.body = {
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
            wfhType: 'INVALID_TYPE',
            reason: 'Doctor appointment',
        };

        await requestWorkFromHome(req as AuthenticatedRequest, res as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Invalid wfhType. Must be one of AM, PM, or WD.'
        });
    });

    it('should return 400 if endDate is before startDate', async () => {
        req.body = {
            dateRange: { startDate: '2024-10-20', endDate: '2024-10-14' },
            wfhType: 'AM',
            reason: 'Doctor appointment',
        };

        await requestWorkFromHome(req as AuthenticatedRequest, res as Response);

        expect(statusMock).toHaveBeenCalledWith(400);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'endDate must be the same or after startDate.'
        });
    });

    it('should call applyForWorkFromHome and return 200 on successful request', async () => {
        req.user = { Staff_ID: 123 } as UserPayload;
        req.body = {
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
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
            Staff_ID: 123,
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
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
        req.user = { Staff_ID: 123 } as UserPayload;
        req.body = {
            dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
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
});
