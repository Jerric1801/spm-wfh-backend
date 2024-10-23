import express from 'express';
import authenticateJWT from '../../middleware/authJWT';
import { manageRequest, viewPendingRequests, viewStaffRequests } from './manageRequestController';
import authoriseRole from '../../middleware/authRole';


const router = express.Router();

// POST route to manage requests (approve/reject)
router.post('/', manageRequest);

// GET route to view pending requests, secured with JWT authentication
router.get('/pending', authenticateJWT, authoriseRole(['1', '3']), viewPendingRequests);

//GET route to view a staff's own requests regardless of status depending on the request date
router.get('/getStaff', viewStaffRequests);


export default router;
