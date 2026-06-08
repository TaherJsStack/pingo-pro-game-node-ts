import express, { Router, Request, Response } from 'express';
import signReqData from '../../middleware/sign-req-data';
import notificationsController from '../../controllers/api/notifications';

const router: Router = express.Router();

router.get('/outbox', signReqData, async (req: Request, res: Response) => {
  await notificationsController.getOutboxHistory(req, res);
});

export default router;
