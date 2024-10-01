import { Router } from 'express';
import { login } from './authController';

const router = Router();

// Authentication route - Login
router.post('/login', login);

export default router;
