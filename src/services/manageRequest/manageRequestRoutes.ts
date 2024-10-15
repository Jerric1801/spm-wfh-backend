import express from 'express';
import { manageRequest, viewPendingRequests } from './manageRequestController';

const router = express.Router();

// POST route to manage requests (approve/reject)
router.post('/', manageRequest);

// GET route to view pending requests
router.get('/pending', viewPendingRequests);

export default router;
