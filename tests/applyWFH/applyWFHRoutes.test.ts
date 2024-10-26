import request from 'supertest';
import express from 'express';
import applyWFHRoutes from '../../src/services/applyWFH/applyWFHRoutes';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import jwtConfig from '../../src/config/jwt';
import { UserPayload } from '../../src/services/auth/authService';
import { requestWorkFromHome } from '../../src/services/applyWFH/applyWFHController';

// Mock the database and JWT
jest.mock('../../src/config/db');
jest.mock('jsonwebtoken');

// Mock the service method (to avoid actual business logic)
jest.mock('../../src/services/applyWFH/applyWFHController', () => ({
  requestWorkFromHome: jest.fn(),
}));

interface AuthenticatedRequest extends Request {
    user?: UserPayload;  // Use the defined `UserPayload` type
  }

// Mock the JWT verification function
// const mockQuery = pool.query as jest.Mock;
const mockJwtVerify = jwt.verify as jest.Mock;
const mockRequestWorkFromHome = requestWorkFromHome as jest.Mock;

// Set up an Express app to test the routes
const app = express();
app.use(express.json());
app.use('/wfh', applyWFHRoutes);

// Mock middleware for JWT authentication
jest.mock('../../src/middleware/authJWT', () => {
  return {
    __esModule: true,
    default: (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        mockJwtVerify(token, jwtConfig.secretKey, (err: Error | null, user: UserPayload | null) => {
          if (err) {
            return res.sendStatus(403);
          }
          req.user = user as UserPayload;
          next();
        });
      } else {
        res.sendStatus(401);
      }
    },
  };
});

describe('POST /apply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 401 if no authorization header is provided', async () => {
    const response = await request(app)
      .post('/wfh/apply')  // Apply WFH route
      .send({
        dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
        wfhType: 'AM',
        reason: 'Doctor appointment',
      });

    expect(response.status).toBe(401);  // No authorization header
  });

  test('should return 403 if JWT verification fails', async () => {
    mockJwtVerify.mockImplementationOnce((token, secret, callback) => {
      callback(new Error('Invalid token'), null);  // Simulate invalid token
    });

    const response = await request(app)
      .post('/wfh/apply')
      .set('Authorization', 'Bearer invalidToken')
      .send({
        dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
        wfhType: 'AM',
        reason: 'Doctor appointment',
      });

    expect(response.status).toBe(403);  // Forbidden due to invalid token
  });

  test('should call requestWorkFromHome if the user is authenticated', async () => {
    // Simulate a valid token
    const mockUser: UserPayload = { Staff_ID: 123, Role: 'Employee', Staff_FName: 'Jerric', Staff_LName: 'Chan', Dept: 'Engineering', Country: 'Singapore', Email: 'Jerric.Chan@allinone.com.sg', Position: 'Director'};
    mockJwtVerify.mockImplementationOnce((token, secret, callback) => {
      callback(null, mockUser);  // Valid token
    });

    // Mock requestWorkFromHome to return success
    mockRequestWorkFromHome.mockImplementationOnce((req: Request, res: Response) => {
      res.status(200).json({ message: 'Work-from-home request submitted successfully' });
    });

    const response = await request(app)
      .post('/wfh/apply')
      .set('Authorization', 'Bearer validToken')  // Valid token
      .send({
        dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
        wfhType: 'AM',
        reason: 'Doctor appointment',
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Work-from-home request submitted successfully');
    expect(mockRequestWorkFromHome).toHaveBeenCalledTimes(1);  // Verify the controller was called
  });

  test('should return 500 if the requestWorkFromHome controller throws an error', async () => {
    // Simulate a valid token
    const mockUser: UserPayload = { Staff_ID: 123, Role: 'Employee', Staff_FName: 'Jerric', Staff_LName: 'Chan', Dept: 'Engineering', Country: 'Singapore', Email: 'Jerric.Chan@allinone.com.sg', Position: 'Director'};
    mockJwtVerify.mockImplementationOnce((token, secret, callback) => {
      callback(null, mockUser);  // Valid token
    });

    // Simulate an error in requestWorkFromHome
    mockRequestWorkFromHome.mockImplementationOnce((req: Request, res: Response) => {
      res.status(500).json({ message: 'Internal Server Error' });
    });

    const response = await request(app)
      .post('/wfh/apply')
      .set('Authorization', 'Bearer validToken')
      .send({
        dateRange: { startDate: '2024-10-14', endDate: '2024-10-20' },
        wfhType: 'AM',
        reason: 'Doctor appointment',
      });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe('Internal Server Error');
  });
});
