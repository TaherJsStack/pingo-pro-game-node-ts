import express from 'express';
import PaymentManager from '../../controllers/api/payment-manager';
import PaymentMethodManager from '../../controllers/api/payment-method-manager';
import signReqData from '../../middleware/sign-req-data';
import { createRateLimit } from '../../middleware/rate-limit';
import { asyncHandler } from '../../util/asyncHandler';

const router = express.Router();
const paymentManager = new PaymentManager();
const paymentMethodManager = new PaymentMethodManager();
const initiateRateLimit = createRateLimit(10, 60 * 1000);

router.post('/initiate', signReqData, initiateRateLimit, asyncHandler(paymentManager.initiate as any));

// Saved payment methods (masked; never returns tokens). Defined before '/:id' so the
// literal 'methods' segment is not captured as a payment id.
router.get('/methods', signReqData, asyncHandler(paymentMethodManager.list as any));
router.patch('/methods/:id/default', signReqData, asyncHandler(paymentMethodManager.setDefault as any));
router.delete('/methods/:id', signReqData, asyncHandler(paymentMethodManager.deactivate as any));

router.get('', signReqData, asyncHandler(paymentManager.list as any));
router.get('/:id', signReqData, asyncHandler(paymentManager.getById as any));

export default router;
