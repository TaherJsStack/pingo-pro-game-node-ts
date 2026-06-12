import express from 'express';
import { BillingController } from '../../controllers/root-api/billing';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const controller = new BillingController();

router.post('/run-due', asyncHandler(controller.runDue));
router.post('/reconcile', asyncHandler(controller.reconcile));
router.post('/webhooks/:id/replay', asyncHandler(controller.replayWebhook));

export default router;
