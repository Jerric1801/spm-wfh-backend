import express from 'express';
import authenticateJWT from '../../middleware/authJWT';
import { viewSchedule } from './viewScheduleController';

const router = express.Router();

// Manager/HR view of work-from-home schedule
router.get('/schedule', authenticateJWT, viewSchedule);
router.get('/schedule', authenticateJWT, viewScheduleStats)

export default router;