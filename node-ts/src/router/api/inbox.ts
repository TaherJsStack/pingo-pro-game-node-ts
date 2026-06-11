import express, { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { InboxController } from '../../controllers/api/inbox';
import signReqData from '../../middleware/sign-req-data';
import { AuthenticatedRequest } from '../../types/auth';

const router: Router = express.Router();
const controller: InboxController = new InboxController();

router.post(
  '',
  signReqData,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await controller.createItem(req as AuthenticatedRequest, res);
  }
);

router.get('', signReqData, controller.getAllItems);
router.get('/unread-count', signReqData, controller.getUnreadCount);
router.patch('/:id/seen', signReqData, controller.markSeen);

export default router;
