import { Request, Response, NextFunction } from 'express';
import { UserPayload } from '../services/auth/authService'; // Assuming UserPayload defines user data structure


interface AuthenticatedRequest extends Request {
    user?: UserPayload; // Include user data from JWT
}

const authoriseRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    // Make sure the user's role is in the list of allowed roles
    if (!user || !allowedRoles.includes(user.Role)) {
      return res.status(403).json({ message: 'Access denied - insufficient permissions.' });
    }

    next();
  };
};

export default authoriseRole;
