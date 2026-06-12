import express from 'express';

import {AuthController} from '../../controllers/root-api/auth';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const controller = new AuthController();

// Route to get a statistics
router.get("", asyncHandler(controller.getAll));

export default router;
