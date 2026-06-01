import express, { Request, Response, Router } from 'express';
import signReqData from '../../middleware/sign-req-data';
import SubscriptionManager from '../../controllers/api/subscription-manager';
import { SendResponse } from '../../controllers/base/sendResponse';

interface AuthRequest extends Request {
  authData?: {
    id: string;
  };
}

class SubscriptionResponse extends SendResponse {
  ok(req: Request, res: Response, statusCode: number, data: any[], totalData?: number) {
    this.sendResponse(req, res, statusCode, data, totalData);
  }

  fail(req: Request, res: Response, error: any) {
    this.sendErrorResponse(req, res, error);
  }
}

const router: Router = express.Router();
const subscriptionManager = new SubscriptionManager();
const response = new SubscriptionResponse();

router.post('/subscribe', signReqData, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.body.userId || req.authData?.id;
    const { plan = null, trialDays = 0 } = req.body;
    const subscription = await subscriptionManager.createSubscription(userId, plan, Number(trialDays));
    response.ok(req, res, 201, [subscription], 1);
  } catch (error) {
    response.fail(req, res, error);
  }
});

router.get('', signReqData, async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await subscriptionManager.getSubscription(req.authData?.id as string);
    const data = subscription ? [subscription] : [];
    response.ok(req, res, 200, data, data.length);
  } catch (error) {
    response.fail(req, res, error);
  }
});

router.get('/member/:id', async (req: Request, res: Response) => {
  try {
    const subscription = await subscriptionManager.getSubscription(req.params.id);
    const data = subscription ? [subscription] : [];
    response.ok(req, res, 200, data, data.length);
  } catch (error) {
    response.fail(req, res, error);
  }
});

router.get('/trial-check/:id', async (req: Request, res: Response) => {
  try {
    const isActive = await subscriptionManager.isTrialPeriodActive(req.params.id);
    response.ok(req, res, 200, [{ trialActive: isActive }], 1);
  } catch (error) {
    response.fail(req, res, error);
  }
});

router.put('/member/:id', async (req: Request, res: Response) => {
  try {
    const { plan } = req.body;
    const subscription = await subscriptionManager.updateSubscription(req.params.id, plan);
    const data = subscription ? [subscription] : [];
    response.ok(req, res, 200, data, data.length);
  } catch (error) {
    response.fail(req, res, error);
  }
});

router.put('/renew/:id', async (req: Request, res: Response) => {
  try {
    const subscription = await subscriptionManager.renewSubscription(req.params.id);
    const data = subscription ? [subscription] : [];
    response.ok(req, res, 200, data, data.length);
  } catch (error) {
    response.fail(req, res, error);
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const subscription = await subscriptionManager.cancelSubscription(req.params.id);
    const data = subscription ? [subscription] : [];
    response.ok(req, res, 200, data, data.length);
  } catch (error) {
    response.fail(req, res, error);
  }
});

export default router;
