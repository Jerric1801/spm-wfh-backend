import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../../config/db'; // Import the connection pool from db.ts
import dotenv from 'dotenv';

dotenv.config();

export interface UserPayload {
  Staff_ID: number;
  Staff_FName: string;
  Staff_LName: string;
  Role: string;
  Dept: string;
}

export const authenticateUser = async (Staff_ID: number, password: string) => {
  try {
    // Query the database using the pool
    console.log("Reached Service")
    const result = await pool.query('SELECT * FROM "Credentials" WHERE "Staff_ID" = $1', [Staff_ID]);
    const user = result.rows[0];

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Compare provided password with hashed_password in the database
    const isPasswordValid = await bcrypt.compare(password, user.hashed_password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const payload: UserPayload = {
      Staff_ID: user.Staff_ID,
      Staff_FName : user.Staff_FName,
      Staff_LName : user.Staff_LName,
      Role: user.Role,
      Dept: user.Dept
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: process.env.JWT_EXPIRATION,
    });

    return { token };
  } catch (error) {
    throw new Error(error.message || 'Authentication failed');
  }
};


