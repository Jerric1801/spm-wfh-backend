import request from "supertest";
import express from "express";
import manageRequestRouter from "../../src/services/manageRequest/manageRequestRoutes";
import pool from "../../src/config/db";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

interface AuthenticatedRequest extends Request {
  user?: UserPayload; // Use the defined `UserPayload` type
}
import jwtConfig from "../../src/config/jwt";
import { UserPayload } from "../../src/services/auth/authService";

jest.mock("../../src/config/db");
jest.mock("jsonwebtoken");

const mockQuery = pool.query as jest.Mock;
const mockJwtVerify = jwt.verify as jest.Mock;

const app = express();
app.use(express.json());
app.use("/requests", manageRequestRouter);

// Mock middleware for authentication
jest.mock("../../src/middleware/authJWT", () => {
  return {
    __esModule: true,
    default: (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const token = authHeader.split(" ")[1];
        mockJwtVerify(
          token,
          jwtConfig.secretKey,
          (err: Error | null, user: UserPayload | null) => {
            if (err) {
              return res.sendStatus(403);
            }
            req.user = user as UserPayload;
            next();
          }
        );
      } else {
        res.sendStatus(401);
      }
    },
  };
});

// Mock middleware for role authorization
jest.mock("../../src/middleware/authRole", () => {
  return {
    __esModule: true,
    default: (allowedRoles: string[]) => {
      return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user || !allowedRoles.includes(user.Role)) {
          return res
            .status(403)
            .json({ message: "Access denied - insufficient permissions." });
        }
        next();
      };
    },
  };
});

describe("manageRequestRoute", () => {
  beforeEach(() => {
    // Mock jwt.verify to always return a valid user for valid-token
    mockJwtVerify.mockImplementation((token, secret, callback) => {
      if (token === "valid-token") {
        callback(null, { Staff_ID: "150118", Role: "1" });
      } else {
        callback(new Error("Invalid token"), null);
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /requests/pending", () => {
    test("should return 200 for authenticated and authorized user", async () => {
      // Simplified mock data - focus on the structure, not the exact values
      const mockPendingRequests: {
        Request_ID: number;
        Staff_ID: number;
        Staff_FName: string;
        Staff_LName: string;
        Request_Reason: string;
        Document: string[];
        dates: Date[];
        wfh_types: string[];
      }[] = [
        {
          Request_ID: 1,
          Staff_ID: 123,
          Staff_FName: "John",
          Staff_LName: "Doe",
          Request_Reason: "Vacation",
          Document: [],
          dates: [new Date()],
          wfh_types: ["Full Day"],
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: mockPendingRequests });

      const response = await request(app)
        .get("/requests/pending")
        .set("Authorization", "Bearer valid-token");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message"); // Just check for the message property
      expect(response.body).toHaveProperty("data"); // and the data property
    });
  });

  test("should return 403 if user does not have the correct role", async () => {
    mockJwtVerify.mockImplementation((token, secret, callback) => {
      callback(null, { Staff_ID: "150118", Role: "2" }); // Mock user with insufficient role
    });

    const response = await request(app)
      .get("/requests/pending")
      .set("Authorization", "Bearer valid-token");
    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      message: "Access denied - insufficient permissions.",
    });
  });

  test("should return 200 if no pending requests are found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await request(app)
      .get("/requests/pending")
      .set("Authorization", "Bearer valid-token");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "No pending requests found." });
  });

  test("should return 500 if an error occurs", async () => {
    mockQuery.mockRejectedValueOnce(new Error("Database error"));

    const response = await request(app)
      .get("/requests/pending")
      .set("Authorization", "Bearer valid-token");
    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: "Internal server error" });
  });

  describe("POST /requests", () => {
    test("should return 200 and approve a request if action is approve", async () => {
      const mockStaffDetailsResult = {
        rows: [
          {
            Staff_FName: "John",
            Staff_LName: "Doe",
            Email: "john.doe@example.com",
          },
        ],
      };
      mockQuery
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce(mockStaffDetailsResult);

      const response = await request(app)
        .post("/requests")
        .send({ requestId: 1, action: "approve" })
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Request approved successfully.",
      });
    });

    test("should return 200 and reject a request if action is reject with a valid reason", async () => {
      const mockStaffDetailsResult = {
        rows: [
          {
            Staff_FName: "John",
            Staff_LName: "Doe",
            Email: "john.doe@example.com",
          },
        ],
      };
      mockQuery
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce(mockStaffDetailsResult);

      const response = await request(app)
        .post("/requests")
        .send({
          requestId: 2,
          action: "reject",
          managerReason: "Valid rejection reason",
        })
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Request rejected successfully.",
      });
    });

    test("should return 400 for an invalid action", async () => {
      const response = await request(app)
        .post("/requests")
        .send({ requestId: 3, action: "invalidAction" })
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ message: "Invalid action" });
    });

    test("should return 500 if an error occurs during approve/reject", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/requests")
        .send({ requestId: 4, action: "approve" })
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /requests/allRequest", () => {
    test("should return pending requests for authenticated and authorized user", async () => {
      const mockRequests = [
        { Request_ID: 1, Current_Status: "Pending", Staff_ID: 150118 },
        { Request_ID: 2, Current_Status: "Pending", Staff_ID: 150119 },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRequests });

      const response = await request(app)
        .get("/requests/allRequest")
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Requests fetched",
        data: mockRequests,
      });
    });

    test("should return 403 if user does not have the correct role", async () => {
      mockJwtVerify.mockImplementation((token, secret, callback) => {
        callback(null, { Staff_ID: "150118", Role: "2" }); // Mock user with insufficient role
      });

      const response = await request(app)
        .get("/requests/allRequest")
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Access denied - insufficient permissions.",
      });
    });

    test("should return 200 if are no requests are found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get("/requests/allRequest")
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "No requests found." });
    });

    test("should return 500 if an error occurs", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get("/requests/allRequest")
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal server error" });
    });
  });

  describe("GET /requests/allRequest", () => {
    test("should return all requests for authenticated and authorized user", async () => {
      const mockRequests = [
        { Request_ID: 1, Current_Status: "Pending", Staff_ID: 150118 },
        { Request_ID: 2, Current_Status: "Approved", Staff_ID: 150119 },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockRequests });

      const response = await request(app)
        .get("/requests/allRequest")
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Requests fetched",
        data: mockRequests,
      });
    });

    test("should return 403 if user is not authorized", async () => {
      mockJwtVerify.mockImplementation((token, secret, callback) => {
        callback(null, { Staff_ID: "150118", Role: "2" }); // Unauthorized role
      });

      const response = await request(app)
        .get("/requests/allRequest")
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(403);
      expect(response.body).toEqual({
        message: "Access denied - insufficient permissions.",
      });
    });

    test("should return 200 if no requests are found", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get("/requests/allRequest")
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ message: "No requests found." });
    });

    test("should return 500 if an error occurs", async () => {
      mockQuery.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .get("/requests/allRequest")
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal server error" });
    });
  });
  describe("POST /requests/withdraw", () => {
    test("should withdraw a request if requestId is valid and reason is provided", async () => {
      // Mock the service call to return a successful withdrawal
      const mockManagerQueryResult = { rows: [{ Reporting_Manager: "123" }] };
      const mockManagerDetailsResult = { rows: [{ Staff_FName: "John", Staff_LName: "Doe", Email: "john.doe@example.com" }] };
      mockQuery.mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce(mockManagerQueryResult) // Mock manager query
      .mockResolvedValueOnce(mockManagerDetailsResult); // Mock manager details query;;

      const response = await request(app)
        .post("/requests/withdraw")
        .send({ requestId: 1, requestReason: "Personal reasons" })
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: "Request withdrawn successfully",
      });
    });

    test("should return 400 if request reason is not provided", async () => {
      const response = await request(app)
        .post("/requests/withdraw")
        .send({ requestId: 2 }) // Missing requestReason
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: "Request reason must be provided",
      });
    });

    test("should return 404 if request is not found or already processed", async () => {
      // Mock the service to return no matching rows
      const mockManagerQueryResult = { rows: [{ Reporting_Manager: "123" }] };
      const mockManagerDetailsResult = { rows: [{ Staff_FName: "John", Staff_LName: "Doe", Email: "john.doe@example.com" }] };
      mockQuery.mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce(mockManagerQueryResult) // Mock manager query
      .mockResolvedValueOnce(mockManagerDetailsResult); // Mock manager details query;;

      const response = await request(app)
        .post("/requests/withdraw")
        .send({ requestId: 999, requestReason: "Valid reason" })
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        message: "Request not found or already processed",
      });
    });

    test("should return 500 if an error occurs", async () => {
      // Mock a database error
      mockQuery.mockRejectedValueOnce(new Error("Database error"));

      const response = await request(app)
        .post("/requests/withdraw")
        .send({ requestId: 4, requestReason: "Valid reason" })
        .set("Authorization", "Bearer valid-token");
      expect(response.status).toBe(500);
      expect(response.body).toEqual({ message: "Internal server error" });
    });
  });
});