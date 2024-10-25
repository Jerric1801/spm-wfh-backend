// src/services/applyWFH/applyWFHRoutes.ts
import express from 'express';
import authenticateJWT from '../../middleware/authJWT';
import { requestWorkFromHome } from './applyWFHController';

import {handleDocumentUpload} from './applyWFHService'

const router = express.Router();

router.post('/', handleDocumentUpload)
// Endpoint for applying for work-from-home
router.post('/apply', authenticateJWT, requestWorkFromHome);

export default router;