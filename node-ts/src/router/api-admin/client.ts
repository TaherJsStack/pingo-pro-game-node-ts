import express from 'express';

import {ClientController} from '../../controllers/root-api/client';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const controller = new ClientController();

// Route to get a statistics
router.get("", asyncHandler(controller.getAllItems));

export default router;
