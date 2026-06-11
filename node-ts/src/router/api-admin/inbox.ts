import express, { NextFunction, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';

import { InboxController } from '../../controllers/root-api/inbox';

const router = express.Router();
const controller = new InboxController();

router.get('', controller.getAllItems);

router.post(
  '/send',
  [
    check('ownerIds').isArray({ min: 1 }),
    check('title').notEmpty(),
    check('context').notEmpty(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      await controller.sendToOwners(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
