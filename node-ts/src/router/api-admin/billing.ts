import express, { NextFunction, Request, Response } from 'express';
import { BillingController } from '../../controllers/root-api/billing';
import signReqData from '../../middleware/sign-req-data';

const router = express.Router();
const controller = new BillingController();

function asyncHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}

router.post('/run-due', signReqData, asyncHandler(controller.runDue));
router.post('/reconcile', signReqData, asyncHandler(controller.reconcile));

export default router;
