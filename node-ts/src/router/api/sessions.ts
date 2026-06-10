import express, { Router, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
// import checkAuth from '../../middleware/check-auth';
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
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('devices').notEmpty().withMessage('devices is required'),
    check('clientId').optional({ nullable: true, checkFalsy: true }),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to create item
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
    // Validation rules using express-validator
    check('brancheId').notEmpty().withMessage('brancheId is required'),
    check('deviceId').optional({ nullable: true }),
    check('clientId').optional({ nullable: true }),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await sessionController.updateItem(req, res);
  }
);

router.put(
  '/endSession/:id',
  signReqData,
  [
    // Validation rules using express-validator
    check('deviceId').optional().notEmpty().withMessage('deviceId is required'),
    check('devicesIds').optional().isArray({ min: 1 }).withMessage('devicesIds must be a non-empty array'),
  ],
  idempotencyMiddleware,
  async (req: Request, res: Response) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Call controller method to update item
    await sessionController.endSession(req as CreateItemRequest, res);
  }
);

// Other routes for GET (Read) and DELETE operations...
router.get("", signReqData, sessionController.getAllItems);

router.delete('/:id', signReqData, idempotencyMiddleware, sessionController.deleteItem)
router.delete('/deleteSessionItem/:id/:endIn', signReqData, idempotencyMiddleware, sessionController.deleteSessionItem)
router.delete('/deleteAllReletedToBill/:id/:endIn', signReqData, idempotencyMiddleware, sessionController.deleteAllReletedToBill)

export default router;
