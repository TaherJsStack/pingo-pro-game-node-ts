import express, { NextFunction, Request, Response } from 'express';
import PaymentManager from '../../controllers/api/payment-manager';
import signReqData from '../../middleware/sign-req-data';
import { createRateLimit } from '../../middleware/rate-limit';

const router = express.Router();
const paymentManager = new PaymentManager();
const initiateRateLimit = createRateLimit(10, 60 * 1000);

function asyncHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}

router.post('/initiate', signReqData, initiateRateLimit, asyncHandler(paymentManager.initiate as any));
router.get('', signReqData, asyncHandler(paymentManager.list as any));
router.get('/:id', signReqData, asyncHandler(paymentManager.getById as any));

export default router;
