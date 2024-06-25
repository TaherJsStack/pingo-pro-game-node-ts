import express from 'express';

import {AuditController} from '../../controllers/root-api/audit';

const router = express.Router();
const controller = new AuditController();

// Route to get a statistics
router.get("", controller.getAllItems);

export default router;
