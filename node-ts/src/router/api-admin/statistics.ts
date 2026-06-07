import express from 'express';

import {StatisticsController} from '../../controllers/root-api/statistics';
import signReqData from '../../middleware/sign-req-data';
import rootAuthGuard from '../../middleware/root-auth.guard';

const router = express.Router();
const controller = new StatisticsController();

router.use(signReqData, rootAuthGuard);

// Route to get a statistics
router.get("/aggregate", controller.getAggregate);
router.get("", controller.getCollectionStatistics);
router.get("/kpi", controller.getPlatformKpiSummary);

export default router;
