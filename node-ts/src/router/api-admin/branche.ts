import express from 'express';

import {BrancheController} from '../../controllers/root-api/branche';

const router = express.Router();
const controller = new BrancheController();

// Route to get a statistics
router.get("", controller.getAllItems);

export default router;
