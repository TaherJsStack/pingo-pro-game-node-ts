import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import signReqData from '../../middleware/sign-req-data';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import { ShiftController } from '../../controllers/api/shift';

const router: Router = express.Router();
const shiftController: ShiftController = new ShiftController();

router.post(
  '/open',
  signReqData,
  [
    check('openingCash')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('openingCash must be a non-negative number')
      .toFloat(),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e: any) => e.msg),
        status: 400,
        message: '',
        data: {},
      });
    }
    await shiftController.openShift(req as any, res);
  }
);

router.put(
  '/close/:id',
  signReqData,
  [
    check('closingCash')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('closingCash must be a non-negative number')
      .toFloat(),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e: any) => e.msg),
        status: 400,
        message: '',
        data: {},
      });
    }
    await shiftController.closeShift(req as any, res);
  }
);

router.get('/current', signReqData, async (req: Request, res: Response) => {
  await shiftController.getCurrentShift(req as any, res);
});

router.get('/summary', signReqData, async (req: Request, res: Response) => {
  await shiftController.getDailySummary(req as any, res);
});

router.post(
  '/seed-mock',
  (req: Request, res: Response, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ success: false, errors: ['Not found'], status: 404, message: '', data: {} });
    }
    next();
  },
  signReqData,
  [
    check('monthsBack')
      .optional()
      .isInt({ min: 1, max: 24 })
      .withMessage('monthsBack must be an integer between 1 and 24')
      .toInt(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e: any) => e.msg),
        status: 400,
        message: '',
        data: {},
      });
    }
    await shiftController.seedMockShifts(req as any, res);
  }
);

router.get('', signReqData, shiftController.getAllItems);

export default router;
