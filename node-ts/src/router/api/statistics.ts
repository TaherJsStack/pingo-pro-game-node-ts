import express, { Router } from "express";
import { Request, Response } from "express";
import { StatisticsController } from "../../controllers/api/statistics";

const router: Router = express.Router();
const statisticsController: StatisticsController = new StatisticsController();


router.get("/getGroupedInvoicesByClosedBy", (req: Request, res: Response) => {
  statisticsController.getGroupedInvoicesByClosedBy(req, res);
});

router.get("/member/:id", (req: Request, res: Response) => {

  statisticsController.getGroupedInvoicesByClosedByMemberId(req, res);
});

router.get("/kpi", (req: Request, res: Response) => {
  statisticsController.getKpiSummary(req, res);
});

router.get("/top-customers", (req: Request, res: Response) => {
  statisticsController.getTopCustomers(req, res);
});

export default router;
