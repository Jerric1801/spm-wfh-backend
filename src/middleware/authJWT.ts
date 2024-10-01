import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt';
import { UserPayload } from '../services/auth/authService';

interface AuthenticatedRequest extends Request {
    user?: UserPayload;  // Use the defined `UserPayload` type
  }

const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];  // Extract the token

    jwt.verify(token, jwtConfig.secretKey, (err, user) => {
      if (err) {
        return res.sendStatus(403);  // Forbidden if token is invalid
      }

      // Attach the decoded user information to req.user
      req.user = user as UserPayload;
      next();  // Call the next middleware or route handler
    });
  } else {
    res.sendStatus(401);  // Unauthorized if token is missing
  }
};

export default authenticateJWT;
