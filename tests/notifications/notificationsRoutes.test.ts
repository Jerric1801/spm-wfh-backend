import request from "supertest";
import express from "express";
import notificationsRoutes from "../../src/services/notifications/notificationsRoutes";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getNotifications, updateViewedStatus } from "../../src/services/notifications/notificationsService";
import jwtConfig from "../../src/config/jwt";
import { UserPayload } from "../../src/services/auth/authService";

interface AuthenticatedRequest extends Request {
    user?: UserPayload;  // Use the defined `UserPayload` type
}

// Mock the database and JWT
jest.mock("../../src/config/db");
jest.mock("jsonwebtoken");
jest.mock("../../src/services/notifications/notificationsService");

// Mock the JWT verification function
const mockJwtVerify = jwt.verify as jest.Mock;
const mockGetNotifications = getNotifications as jest.Mock;
const mockUpdateViewedStatus = updateViewedStatus as jest.Mock;

// Set up an Express app to test the routes
const app = express();
app.use(express.json());
app.use('/notifications', notificationsRoutes);

// Mock middleware for JWT authentication
jest.mock("../../src/middleware/authJWT", () => {
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

describe('applyWFHRoutes', () => {
  beforeEach(() => {
    mockJwtVerify.mockReset();
  });

  describe('GET /notifications', () => {
    it('should return 401 if no authorization header is present', async () => {
      const response = await request(app).get('/notifications');

      expect(response.status).toBe(401);
    });

    it('should return 403 if token verification fails', async () => {
      mockJwtVerify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      const response = await request(app)
        .get('/notifications')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(403);
    });

    it('should return 200 with notifications if token is valid', async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '1', Staff_FName: 'Jerric', Staff_LName: 'Chan', Dept: 'HR', Email: 'jerric.chan@allinone.com', Country: 'Singapore', Position: 'Manager' };
      mockJwtVerify.mockImplementation((token, secret, callback) => {
        callback(null, user);
      });

      const mockNotifications = {
        manager: [
          { requestId: 1, currentStatus: 'Pending', earliestDate: '2023-11-01', latestDate: '2023-11-03' }
        ],
        user: [
          { requestId: 2, currentStatus: 'Approved', earliestDate: '2023-11-02', latestDate: '2023-11-04' }
        ]
      };
      mockGetNotifications.mockResolvedValueOnce(mockNotifications);

      const response = await request(app)
        .get('/notifications')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Pending requests fetched');
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('POST /notifications/accept', () => {
    it('should return 401 if no authorization header is present', async () => {
      const response = await request(app).post('/notifications/accept').send({ requestIdArr: [1, 2, 3] });

      expect(response.status).toBe(401);
    });

    it('should return 403 if token verification fails', async () => {
      mockJwtVerify.mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      const response = await request(app)
        .post('/notifications/accept')
        .set('Authorization', 'Bearer invalid_token')
        .send({ requestIdArr: [1, 2, 3] });

      expect(response.status).toBe(403);
    });

    it('should return 200 if notifications are accepted successfully', async () => {
      const user: UserPayload = { Staff_ID: 1, Role: '1', Staff_FName: 'Jerric', Staff_LName: 'Chan', Dept: 'HR', Email: 'jerric.chan@allinone.com', Country: 'Singapore', Position: 'Manager' };
      mockJwtVerify.mockImplementation((token, secret, callback) => {
        callback(null, user);
      });

      mockUpdateViewedStatus.mockResolvedValue('Viewed status updated successfully');
      jest.mock('../../src/services/notifications/notificationsService', () => ({
        updateViewedStatus: mockUpdateViewedStatus
      }));

      const response = await request(app)
        .post('/notifications/accept')
        .set('Authorization', 'Bearer valid_token')
        .send({ requestIdArr: [1, 2, 3] });

      expect(response.status).toBe(200);
      expect(response.body).toBe('Viewed status updated successfully');

    });
  });
});
