import express, { NextFunction, Request, Response } from 'express';
import { PaymentAdminController } from '../../controllers/root-api/payment-admin';
import signReqData from '../../middleware/sign-req-data';
import rootAuthGuard from '../../middleware/root-auth.guard';

const router = express.Router();
const controller = new PaymentAdminController();

function asyncHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}

// Every payment-ops read is authenticated and root-only.
router.use(signReqData, rootAuthGuard);

router.get('/subscriptions', asyncHandler(controller.listSubscriptions));
router.get('/payments', asyncHandler(controller.listPayments));
router.get('/payment-methods', asyncHandler(controller.listPaymentMethods));
router.get('/webhook-events', asyncHandler(controller.listWebhookEvents));

export default router;
