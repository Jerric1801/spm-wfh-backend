import express from 'express';
import authenticateJWT from '../../middleware/authJWT';
import { manageRequest, viewPendingRequests, viewStaffRequests,viewRequests, withdrawRequest, getPendingRequestCountController } from './manageRequestController';
import authoriseRole from '../../middleware/authRole';


const router = express.Router();

// POST route to manage requests (approve/reject)
router.post('/', manageRequest);

// GET route to view pending requests, secured with JWT authentication
router.get('/pending', authenticateJWT, authoriseRole(['1', '3']), viewPendingRequests);

//GET route to view a staff's own requests regardless of status depending on the request date
router.get('/getStaff',authenticateJWT, viewStaffRequests);

// GET route to view requests, secured with JWT authentication for manager to view staffs requests
router.get('/allRequest', authenticateJWT, authoriseRole(['1', '3']), viewRequests);

router.post('/withdraw', authenticateJWT, withdrawRequest);

router.get('/pending/count', authenticateJWT, authoriseRole(['1', '3']), getPendingRequestCountController);

export default router;
