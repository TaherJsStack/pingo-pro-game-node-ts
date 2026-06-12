import express from 'express';
import WebhookManager from '../../controllers/api/webhook-manager';
import { createRateLimit } from '../../middleware/rate-limit';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const webhookManager = new WebhookManager();
const webhookRateLimit = createRateLimit(120, 60 * 1000);
const rawBody = express.raw({ type: '*/*' });

router.post('/paypal', webhookRateLimit, rawBody, asyncHandler(webhookManager.paypal));
router.post('/paymob', webhookRateLimit, rawBody, asyncHandler(webhookManager.paymob));

export default router;
