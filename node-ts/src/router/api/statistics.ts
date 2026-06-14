import express, { Router } from "express";
import { Request, Response } from "express";
import { StatisticsController } from "../../controllers/api/statistics";
import signReqData from '../../middleware/sign-req-data';

const router: Router = express.Router();
const statisticsController: StatisticsController = new StatisticsController();


router.get("/getGroupedInvoicesByClosedBy", signReqData, (req: Request, res: Response) => {
  statisticsController.getGroupedInvoicesByClosedBy(req, res);
});


router.get("/kpi", signReqData, (req: Request, res: Response) => {
  statisticsController.getKpiSummary(req, res);
});

router.get("/top-customers", signReqData, (req: Request, res: Response) => {
  statisticsController.getTopCustomers(req, res);
});

export default router;
