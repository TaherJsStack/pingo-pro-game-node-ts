import express, { NextFunction, Request, Response } from 'express';
import { BillingController } from '../../controllers/root-api/billing';
import signReqData from '../../middleware/sign-req-data';
import rootAuthGuard from '../../middleware/root-auth.guard';

const router = express.Router();
const controller = new BillingController();

function asyncHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}

// Operational billing triggers are root-only: authenticate, then require root privileges.
router.post('/run-due', signReqData, rootAuthGuard, asyncHandler(controller.runDue));
router.post('/reconcile', signReqData, rootAuthGuard, asyncHandler(controller.reconcile));
router.post('/webhooks/:id/replay', signReqData, rootAuthGuard, asyncHandler(controller.replayWebhook));

export default router;
