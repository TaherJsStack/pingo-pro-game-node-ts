import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import { isValidObjectId } from 'mongoose';
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
    check('notes')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('notes must be a string under 1000 characters')
      .trim(),
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

router.patch(
  '/:id/notes',
  signReqData,
  [
    check('notes')
      .notEmpty().withMessage('notes is required')
      .isString()
      .isLength({ max: 1000 }).withMessage('notes must be under 1000 characters')
      .trim(),
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
    await shiftController.updateNotes(req as any, res);
  }
);

router.get('/current', signReqData, async (req: Request, res: Response) => {
  await shiftController.getCurrentShift(req as any, res);
});

router.get('/summary', signReqData, async (req: Request, res: Response) => {
  await shiftController.getDailySummary(req as any, res);
});


router.post(
  '/seed-dataset',
  (req: Request, res: Response, next: any) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ success: false, errors: ['Not found'], status: 404, message: '', data: {} });
    }
    next();
  },
  signReqData,
  [
    check('branchId')
      .notEmpty().withMessage('branchId is required')
      .custom((v) => isValidObjectId(v)).withMessage('branchId must be a valid ObjectId'),
    check('seed')
      .optional()
      .isInt({ min: 0 }).withMessage('seed must be a non-negative integer')
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
    await shiftController.seedDataset(req as any, res);
  }
);

router.get('', signReqData, shiftController.getAllItems);

export default router;
