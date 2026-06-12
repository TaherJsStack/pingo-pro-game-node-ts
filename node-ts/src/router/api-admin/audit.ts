import express from 'express';

import {AuditController} from '../../controllers/root-api/audit';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const controller = new AuditController();

// Route to get a statistics
router.get("", asyncHandler(controller.getAllItems));

export default router;
