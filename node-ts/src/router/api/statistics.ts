import express, { Router } from "express";
import { Request, Response } from "express";
import { getGroupedInvoicesByClosedBy } from "../../controllers/api/statistics";

const router: Router = express.Router();

router.get("/getGroupedInvoicesByClosedBy", (req: Request, res: Response) => {
  getGroupedInvoicesByClosedBy(req, res);
});

export default router;