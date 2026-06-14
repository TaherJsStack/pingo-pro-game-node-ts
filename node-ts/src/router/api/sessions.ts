import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import signReqData from '../../middleware/sign-req-data';
import { createPlanGate } from '../../middleware/plan-gate';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import { SessionController } from '../../controllers/api/session';
import { AuthenticatedRequest } from '../../types/auth';

const router: Router = express.Router();

const sessionController: SessionController = new SessionController();

const validationFail = (req: Request, res: Response): boolean => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, errors: errors.array().map((e: any) => e.msg), status: 400, message: '', data: {} });
    return true;
  }
  return false;
};

// Route: POST /sessions (Create session)
router.post(
  '',
  signReqData,
  createPlanGate({
    getRequestedUnits: (req) => (Array.isArray((req as any).body?.devices) ? (req as any).body.devices.length : 1),
  }),
  [
    check('devices').isArray({ min: 1 }).withMessage('devices must be a non-empty array'),
    check('devices.*.deviceId').isMongoId().withMessage('each deviceId must be a valid Mongo id'),
    check('clientId').optional({ nullable: true, checkFalsy: true }),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    if (validationFail(req, res)) return;
    await sessionController.createItem(req as AuthenticatedRequest, res);
  }
);

// Route: GET /sessions/:id
router.get('/:id', signReqData, sessionController.getItemById);

// Route: PUT /sessions/:id (Update session)
router.put(
  '/:id',
  signReqData,
  [
    check('deviceId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('deviceId must be a valid Mongo id'),
    check('clientId').optional({ nullable: true }),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    if (validationFail(req, res)) return;
    await sessionController.updateItem(req, res);
  }
);

// Route: PUT /sessions/endSession/:id
router.put(
  '/endSession/:id',
  signReqData,
  [
    check('deviceId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('deviceId must be a valid Mongo id'),
    check('devicesIds').optional().isArray({ min: 1 }).withMessage('devicesIds must be a non-empty array'),
    check('devicesIds.*').optional().isMongoId().withMessage('each devicesIds entry must be a valid Mongo id'),
    check('endTime').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('endTime must be a valid ISO8601 date'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    if (validationFail(req, res)) return;
    await sessionController.endSession(req as AuthenticatedRequest, res);
  }
);

// Route: GET /sessions
router.get('', signReqData, sessionController.getAllItems);

// Route: DELETE /sessions/:id
router.delete('/:id', signReqData, idempotencyMiddleware, sessionController.deleteItem);

// Route: DELETE /sessions/related-to-bill (ids in body)
router.delete(
  '/related-to-bill',
  signReqData,
  [
    check('ids').isArray({ min: 1, max: 100 }).withMessage('ids must be a non-empty array with max 100 items'),
    check('ids.*').isMongoId().withMessage('each id must be a valid Mongo ObjectId'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    if (validationFail(req, res)) return;
    await sessionController.deleteAllRelatedToBill(req, res);
  }
);

export default router;
