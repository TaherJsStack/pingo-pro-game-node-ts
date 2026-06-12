import express, { NextFunction, Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { ValidationError } from '../../errors/AppError';

import { InboxController } from '../../controllers/root-api/inbox';

const router = express.Router();
const controller = new InboxController();

router.get('', controller.getAllItems.bind(controller));

router.post(
  '/send',
  [
    check('ownerIds').isArray({ min: 1 }).withMessage('ownerIds must be a non-empty array'),
    check('ownerIds.*').isMongoId().withMessage('each ownerId must be a valid MongoId'),
    check('title').notEmpty(),
    check('context').notEmpty(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ValidationError(errors.array().map((e) => e.msg).join(', '));
      }
      await controller.sendToOwners(req, res);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
