import express from 'express';
import { PaymentAdminController } from '../../controllers/root-api/payment-admin';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const controller = new PaymentAdminController();

router.get('/subscriptions', asyncHandler(controller.listSubscriptions));
router.get('/payments', asyncHandler(controller.listPayments));
router.get('/payment-methods', asyncHandler(controller.listPaymentMethods));
router.get('/webhook-events', asyncHandler(controller.listWebhookEvents));

export default router;
