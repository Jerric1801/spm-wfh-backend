import request from 'supertest';
import express from 'express';
import viewScheduleRoutes from '../../src/services/viewSchedule/viewScheduleRoutes';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import jwtConfig from '../../src/config/jwt';
import { UserPayload } from '../../src/services/auth/authService';
import { viewSchedule } from '../../src/services/viewSchedule/viewScheduleController';

// Mock the database and JWT
jest.mock('../../src/config/db');
jest.mock('jsonwebtoken');

// Mock the service method (to avoid actual business logic)
jest.mock('../../src/services/viewSchedule/viewScheduleController', () => ({
  viewSchedule: jest.fn(),
}));

interface AuthenticatedRequest extends Request {
    user?: UserPayload;  // Use the defined `UserPayload` type
}

// Mock the JWT verification function
const mockJwtVerify = jwt.verify as jest.Mock;
const mockViewSchedule = viewSchedule as jest.Mock;

// Set up an Express app to test the routes
const app = express();
app.use(express.json());
app.use('/viewSchedule', viewScheduleRoutes);

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

// Mock middleware for role authorization
jest.mock('../../src/middleware/authRole', () => {
  return {
    __esModule: true,
    default: (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (req.user && roles.includes(req.user.Role)) {
        next();
      } else {
        res.sendStatus(403);
      }
    },
  };
});

describe('GET /viewSchedule', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return 401 if authorization header is missing', async () => {
    const response = await request(app).get('/viewSchedule').query({ startDate: '2024-11-01', endDate: '2024-11-01' });
    expect(response.status).toBe(401);
  });

  test('should return 403 if JWT verification fails', async () => {
    mockJwtVerify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    const response = await request(app)
      .get('/viewSchedule')
      .set('Authorization', 'Bearer invalidtoken')
      .query({ startDate: '2023-01-01', endDate: '2023-01-31' });
    expect(response.status).toBe(403);
  });

  test('should return 403 if user role is not authorized', async () => {
    mockJwtVerify.mockImplementation((token, secret, callback) => {
      callback(null, { Staff_ID: 1, Role: '4' }); // Role '4' is not authorized
    });

    const response = await request(app)
      .get('/viewSchedule')
      .set('Authorization', 'Bearer validtoken')
      .query({ startDate: '2023-01-01', endDate: '2023-01-31' });
    expect(response.status).toBe(403);
  });

  test('should forward request to viewSchedule controller if authentication and authorization are successful', async () => {
    mockJwtVerify.mockImplementation((token, secret, callback) => {
      callback(null, { Staff_ID: 1, Role: '1' });
    });

    const mockSchedule = { '2023-01-01': { dept: { role: { staffId: { staffId: '123', firstName: 'John', lastName: 'Doe', wfhType: 'IN' } } } } };
    mockViewSchedule.mockImplementation((req, res) => {
      res.status(200).json(mockSchedule);
    });

    const response = await request(app)
      .get('/viewSchedule')
      .set('Authorization', 'Bearer validtoken')
      .query({ startDate: '2023-01-01', endDate: '2023-01-31' });
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSchedule);
  });
});