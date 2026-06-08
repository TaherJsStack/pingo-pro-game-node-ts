import express from 'express';

import {DeviceController} from '../../controllers/root-api/device';

const router = express.Router();
const controller = new DeviceController();

// Route to get a statistics
router.get("", controller.getAllItems);

export default router;
