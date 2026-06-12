import express from 'express';

import {ComplaintsSuggestionController} from '../../controllers/root-api/complaints-suggestion';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const controller = new ComplaintsSuggestionController();

// Route to get a statistics
router.get("", asyncHandler(controller.getAllItems));

export default router;
