import express from 'express';

import {DeviceController} from '../../controllers/root-api/device';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const controller = new DeviceController();

// Route to get a statistics
router.get("", asyncHandler(controller.getAllItems));

export default router;
