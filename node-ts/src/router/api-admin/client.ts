import express from 'express';

import {ClientController} from '../../controllers/root-api/client';

const router = express.Router();
const controller = new ClientController();

// Route to get a statistics
router.get("", controller.getAllItems);

export default router;
