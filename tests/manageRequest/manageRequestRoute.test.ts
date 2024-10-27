import request from 'supertest';
import express from 'express';
import manageRequestRouter from '../../src/services/manageRequest/manageRequestRoutes';
import pool from '../../src/config/db';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: UserPayload;  // Use the defined `UserPayload` type
}
import jwtConfig from '../../src/config/jwt';
import { UserPayload } from '../../src/services/auth/authService';

jest.mock('../../src/config/db');
jest.mock('jsonwebtoken');

const mockQuery = pool.query as jest.Mock;
const mockJwtVerify = jwt.verify as jest.Mock;

const app = express();
app.use(express.json());
app.use('/requests', manageRequestRouter);

// Mock middleware for authentication
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
    default: (allowedRoles: string[]) => {
      return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user || !allowedRoles.includes(user.Role)) {
          return res.status(403).json({ message: 'Access denied - insufficient permissions.' });
        }
        next();
      };
    },
  };
});

describe('manageRequestRoute', () => {
  beforeEach(() => {
    // Mock jwt.verify to always return a valid user for valid-token
    mockJwtVerify.mockImplementation((token, secret, callback) => {
      if (token === 'valid-token') {
        callback(null, { Staff_ID: '150118', Role: '1' });
      } else {
        callback(new Error('Invalid token'), null);
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /requests/pending', () => {
    test('should return pending requests for authenticated and authorized user', async () => {
      const mockRequests = [
        {
          Request_ID: 1,
          Current_Status: 'Pending',
          Staff_ID: 150118,
          Staff_FName: 'John',
          Staff_LName: 'Doe',
          dates: [new Date('2024-10-25'), new Date('2024-10-26')],
          wfh_types: ['Full Day'],
          Request_Reason: 'Sick',
        },
        {
          Request_ID: 2,
          Current_Status: 'Pending',
          Staff_ID: 150119,
          Staff_FName: 'Nicolas',
          Staff_LName: 'Tang',
          dates: [new Date('2024-10-25'), new Date('2024-10-26')],
          wfh_types: ['Full Day'],
          Request_Reason: 'Sick',
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockRequests });

      const response = await request(app).get('/requests/pending').set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(200);

      const expected = [
        {
          key: "1",
          id: 150118,
          member: "John Doe",
          dateRange: "25 Oct - 26 Oct",
          wfhType: "Full Day",
          reason: "Sick",
        },
        {
          key: "2",
          id: 150119,
          member: "Nicolas Tang",
          dateRange: "25 Oct - 26 Oct",
          wfhType: "Full Day",
          reason: "Sick",
        },
      ]
      expect(response.body).toEqual({ message: 'Pending requests fetched', data: expected });
    });

    test('should return 403 if user does not have the correct role', async () => {
      mockJwtVerify.mockImplementation((token, secret, callback) => {
        callback(null, { Staff_ID: '150118', Role: '2' }); // Mock user with insufficient role
      });

      const response = await request(app).get('/requests/pending').set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ message: 'Access denied - insufficient permissions.' });
    });

    test('should return 200 if no pending requests are found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app).get('/requests/pending').set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'No pending requests found.' });
    });

    test('should return 500 if an error occurs', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app).get('/requests/pending').set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Internal server error' });
    });
  });

  describe('POST /requests', () => {
    test('should approve a request if action is approve', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .post('/requests')
        .send({ requestId: 1, action: 'approve' })
        .set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Request approved successfully.' });
    });

    test('should reject a request if action is reject with a valid reason', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 });

      const response = await request(app)
        .post('/requests')
        .send({ requestId: 2, action: 'reject', managerReason: 'Valid rejection reason' })
        .set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: 'Request rejected successfully.' });
    });

    test('should return 400 for an invalid action', async () => {
      const response = await request(app)
        .post('/requests')
        .send({ requestId: 3, action: 'invalidAction' })
        .set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: 'Invalid action' });
    });

    test('should return 500 if an error occurs during approve/reject', async () => {
      mockQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await request(app)
        .post('/requests')
        .send({ requestId: 4, action: 'approve' })
        .set('Authorization', 'Bearer valid-token');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: 'Internal server error' });
    });
  });
});
