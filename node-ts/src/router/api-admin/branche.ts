import express from 'express';

import {BrancheController} from '../../controllers/root-api/branche';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const controller = new BrancheController();

// Route to get a statistics
router.get("", asyncHandler(controller.getAllItems));

export default router;
