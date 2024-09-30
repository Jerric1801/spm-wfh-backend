import express from 'express';
import authenticateJWT from '../../middleware/authJWT';
import { viewScheduleManager } from './viewScheduleController';

const router = express.Router();

// Manager/HR view of work-from-home schedule
router.get('/manager', authenticateJWT, viewScheduleManager);

export default router;