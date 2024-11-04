// src/services/applyWFH/applyWFHRoutes.ts
import express from 'express';
import authenticateJWT from '../../middleware/authJWT';
import { showNotifications, acceptNotifications } from './notificationsController';

const router = express.Router();

router.get('/', authenticateJWT, showNotifications)

// Endpoint for notifications to be marked as read
router.post('/accept', authenticateJWT, acceptNotifications);

export default router;