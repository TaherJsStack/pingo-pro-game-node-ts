import express from 'express';

import {AuthController} from '../../controllers/root-api/auth';

const router = express.Router();
const controller = new AuthController();

// Route to get a statistics
router.get("", controller.getAll);

export default router;
