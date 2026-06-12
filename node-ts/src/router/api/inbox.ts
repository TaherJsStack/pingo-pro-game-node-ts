import express, { Router, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { InboxController } from '../../controllers/api/inbox';
import signReqData from '../../middleware/sign-req-data';
import { AuthenticatedRequest } from '../../types/auth';

const router: Router = express.Router();
const controller: InboxController = new InboxController();


router.get('', signReqData, controller.getAllItems);
router.get('/unread-count', signReqData, controller.getUnreadCount);
router.patch('/:id/seen', signReqData, controller.markSeen);

export default router;
