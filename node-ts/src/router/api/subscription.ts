import express, { NextFunction, Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import SubscriptionManager from '../../controllers/api/subscription-manager';
import signReqData from '../../middleware/sign-req-data';
import { SendResponse } from '../../controllers/base/sendResponse';
import { NotFoundError, ValidationError } from '../../errors/AppError';
import { PaymentMethod, PaymentProvider } from '../../enums';
import { planRepository, subscriptionRepository } from '../../repositories/instances';
import PaymentService from '../../services/payment.service';
import SubscriptionService from '../../services/subscription.service';
import { MaybeAuthenticatedRequest as AuthRequest } from '../../types/auth';

class SubscriptionResponse extends SendResponse {
  ok(req: Request, res: Response, statusCode: number, data: any[], totalData?: number) {
    this.sendResponse(req, res, statusCode, data, totalData);
  }
}

const router: Router = express.Router();
const response = new SubscriptionResponse();
const subscriptionManager = new SubscriptionManager();

function asyncHandler(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    handler(req as AuthRequest, res).catch(next);
  };
}

function requireUser(req: AuthRequest): string {
  const userId = req.authData?.id;
  if (!userId) {
    throw new ValidationError('Authenticated user is required.');
  }
  return userId;
}

async function assertOwnsSubscription(subscriptionId: string, userId: string) {
  const subscription = await subscriptionRepository.findById(subscriptionId);
  if (!subscription) {
    throw new NotFoundError('Subscription not found.');
  }
  if (String(subscription.userId) !== String(userId)) {
    throw new ValidationError('Subscription does not belong to the authenticated user.');
  }
  return subscription;
}

router.post(
  '/subscribe',
  signReqData,
  [check('brancheId').isMongoId().withMessage('brancheId must be a valid Mongo id')],
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req as Request);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors.array().map((item) => item.msg).join(', '));
    }

    const userId = requireUser(req);
    const brancheId = String(req.body.brancheId ?? '');
    const { trialDays = 0 } = req.body;
    const planId = req.body.planId || req.body.plan;
    const branch = await subscriptionManager.assertOwnedBranch(brancheId, userId);
    await subscriptionManager.assertFreePlanAvailable(userId, planId);
    const tenantId = branch.tenantId ? String(branch.tenantId) : req.authData?.tenantId ?? null;

    if (Number(trialDays) > 0) {
      const plan = await planRepository.findById(planId);
      if (!plan) {
        throw new NotFoundError('Plan not found.');
      }
      const subscription = await SubscriptionService.startTrial(
        userId,
        brancheId,
        tenantId,
        plan,
        Number(trialDays)
      );
      response.ok(req, res, 201, [subscription], 1);
      return;
    }

    const checkout = await PaymentService.initiate({
      userId,
      brancheId,
      tenantId,
      planId,
      provider: req.body.provider as PaymentProvider,
      method: req.body.method as PaymentMethod,
      idempotencyKey: req.header('Idempotency-Key') ?? undefined,
      walletPhone: req.body.walletPhone ?? undefined,
    });

    response.ok(req, res, 201, [checkout], 1);
  })
);

router.get('', signReqData, asyncHandler(async (req: AuthRequest, res: Response) => {
  const branchId = req.query.brancheId ? String(req.query.brancheId) : undefined;
  const subscription = await SubscriptionService.getSubscription(requireUser(req), branchId);
  const data = subscription ? [subscription] : [];
  response.ok(req, res, 200, data, data.length);
}));

router.get('/member/:id', signReqData, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req);
  if (req.params.id !== userId) {
    throw new ValidationError('Cannot read another user subscription.');
  }
  const branchId = req.query.brancheId ? String(req.query.brancheId) : undefined;
  const subscription = await SubscriptionService.getSubscription(userId, branchId);
  const data = subscription ? [subscription] : [];
  response.ok(req, res, 200, data, data.length);
}));

router.get('/trial-check/:id', signReqData, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req);
  const subscription = await assertOwnsSubscription(req.params.id, userId);
  const now = new Date();
  const isActive = Boolean(subscription.trial && now <= subscription.endDate);
  response.ok(req, res, 200, [{ trialActive: isActive }], 1);
}));

router.put('/member/:id', signReqData, asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req);
  if (req.params.id !== userId) {
    throw new ValidationError('Cannot update another user subscription.');
  }
  const branchId = req.query.brancheId ? String(req.query.brancheId) : undefined;
  const subscription = await SubscriptionService.getSubscription(userId, branchId);
  if (!subscription) {
    throw new NotFoundError('Subscription not found.');
  }
  const updated = await subscriptionRepository.updateById(String(subscription._id), { plan: req.body.plan } as any);
  response.ok(req, res, 200, updated ? [updated] : [], updated ? 1 : 0);
}));

router.patch('/:id/auto-renew', signReqData, asyncHandler(async (req: AuthRequest, res: Response) => {
  await assertOwnsSubscription(req.params.id, requireUser(req));
  const subscription = await SubscriptionService.toggleAutoRenew(req.params.id, Boolean(req.body.autoRenew));
  response.ok(req, res, 200, subscription ? [subscription] : [], subscription ? 1 : 0);
}));

router.delete('/:id', signReqData, asyncHandler(async (req: AuthRequest, res: Response) => {
  await assertOwnsSubscription(req.params.id, requireUser(req));
  const subscription = await SubscriptionService.cancel(req.params.id, {
    atPeriodEnd: Boolean(req.body.cancelAtPeriodEnd ?? req.query.cancelAtPeriodEnd),
  });
  response.ok(req, res, 200, subscription ? [subscription] : [], subscription ? 1 : 0);
}));

export default router;
