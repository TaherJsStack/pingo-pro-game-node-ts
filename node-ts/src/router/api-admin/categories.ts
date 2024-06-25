import express from 'express';

import {CategoryController} from '../../controllers/root-api/categories';

const router = express.Router();
const controller = new CategoryController();

// Route to get a statistics
router.get("", controller.getAllItems);

export default router;
