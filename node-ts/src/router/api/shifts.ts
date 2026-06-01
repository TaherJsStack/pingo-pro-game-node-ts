import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import signReqData from '../../middleware/sign-req-data';
import { ShiftController } from '../../controllers/api/shift';

const router: Router = express.Router();
const shiftController: ShiftController = new ShiftController();

router.post(
  '/open',
  signReqData,
  [check('brancheId').notEmpty().withMessage('brancheId is required')],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    await shiftController.openShift(req as any, res);
  }
);

router.put('/close/:id', signReqData, async (req: Request, res: Response) => {
  await shiftController.closeShift(req as any, res);
});

router.get('/current', signReqData, async (req: Request, res: Response) => {
  await shiftController.getCurrentShift(req as any, res);
});

router.get('/summary', signReqData, async (req: Request, res: Response) => {
  await shiftController.getDailySummary(req as any, res);
});

router.get('', signReqData, shiftController.getAllItems);

export default router;
