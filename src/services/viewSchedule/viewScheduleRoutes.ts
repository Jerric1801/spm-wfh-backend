import express from 'express';
import authenticateJWT from '../../middleware/authJWT';
import authoriseRole from '../../middleware/authRole';
import { viewSchedule } from './viewScheduleController';

const router = express.Router();

// Manager/HR view of work-from-home schedule
router.get('/', authenticateJWT, authoriseRole(['1', '2', '3']), viewSchedule);

export default router;