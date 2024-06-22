import express from 'express';

import {ComplaintsSuggestionController} from '../../controllers/root-api/complaints-suggestion';

const router = express.Router();
const controller = new ComplaintsSuggestionController();

// Route to get a statistics
router.get("", controller.getAllItems);

export default router;
