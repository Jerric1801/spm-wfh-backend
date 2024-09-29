import { Request, Response } from 'express';
import { authenticateUser } from './authService';

export const login = async (req: Request, res: Response) => {
  const { Staff_ID, password } = req.body;
  console.log("Reached Controller")

  if (!Staff_ID || !password) {
    return res.status(400).json({ message: 'Staff_ID and password are required' });
  }

  try {
    const result = await authenticateUser(Staff_ID, password);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};
