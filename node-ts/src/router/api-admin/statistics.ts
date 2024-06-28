import express from 'express';

import {StatisticsController} from '../../controllers/root-api/statistics';

const router = express.Router();
const controller = new StatisticsController();

// Route to get a statistics
router.get("/aggregate", controller.getAggregate);
router.get("", controller.getCollectionStatistics);

export default router;
