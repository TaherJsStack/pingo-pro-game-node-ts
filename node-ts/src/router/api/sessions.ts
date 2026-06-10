import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import signReqData from '../../middleware/sign-req-data';
import { createPlanGate } from '../../middleware/plan-gate';
import { idempotencyMiddleware } from '../../middleware/idempotency';
import { SessionController } from '../../controllers/api/session';
import { ISession } from '../../models/interfaces/session.interface';

const router: Router = express.Router();

const sessionController: SessionController = new SessionController()

interface CreateItemRequest extends Request {
  authData: {
    id: string;
  };
  body: ISession;
}

// Route: POST /items (Create item)
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await sessionController.createItem(req as CreateItemRequest, res);
  }
);

// Route: GET /items/:id (Get item by id)
router.get('/:id', signReqData, sessionController.getItemById);

// Route: PUT /items/:id (Update item)
router.put(
  '/:id',
  signReqData,
  [
    check('deviceId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('deviceId must be a valid Mongo id'),
    check('clientId').optional({ nullable: true }),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await sessionController.updateItem(req, res);
  }
);

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await sessionController.endSession(req as CreateItemRequest, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("", signReqData, sessionController.getAllItems);

router.delete('/:id', signReqData, idempotencyMiddleware, sessionController.deleteItem)
router.delete(
  '/deleteAllReletedToBill/:id',
  signReqData,
  [
    check('ids').isArray({ min: 1, max: 100 }).withMessage('ids must be a non-empty array with max 100 items'),
    check('ids.*').isMongoId().withMessage('each id must be a valid Mongo ObjectId'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await sessionController.deleteAllReletedToBill(req, res);
  }
)

export default router;
