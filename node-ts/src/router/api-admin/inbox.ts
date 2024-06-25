import express from 'express';

import {InboxController} from '../../controllers/root-api/inbox';

const router = express.Router();
const controller = new InboxController();

// Route to get a statistics
router.get("", controller.getAllItems);

export default router;
