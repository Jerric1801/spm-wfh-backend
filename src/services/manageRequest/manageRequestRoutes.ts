import express from 'express';
import authenticateJWT from '../../middleware/authJWT';
import { manageRequest, viewPendingRequests } from './manageRequestController';

const router = express.Router();

// POST route to manage requests (approve/reject)
router.post('/', manageRequest);

// GET route to view pending requests, secured with JWT authentication
router.get('/pending', authenticateJWT, viewPendingRequests);


export default router;
