import express, { NextFunction, Request, Response } from 'express';
import WebhookManager from '../../controllers/api/webhook-manager';
import { createRateLimit } from '../../middleware/rate-limit';

const router = express.Router();
const webhookManager = new WebhookManager();
const webhookRateLimit = createRateLimit(120, 60 * 1000);
const rawBody = express.raw({ type: '*/*' });

function asyncHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req, res).catch(next);
  };
}

router.post('/paypal', webhookRateLimit, rawBody, asyncHandler(webhookManager.paypal));
router.post('/paymob', webhookRateLimit, rawBody, asyncHandler(webhookManager.paymob));

export default router;
