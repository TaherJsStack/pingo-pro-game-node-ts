import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { ValidationError } from '../errors/AppError';
import { planRepository, sessionRepository } from '../repositories/instances';
import SubscriptionService from '../services/subscription.service';

type PlanGateOptions = {
  requiredFeature?: string;
  getRequestedUnits?: (req: GateRequest) => number;
};

type GateRequest = Request & {
  authData?: {
    id?: string;
    tenantId?: string;
  };
  body: Record<string, any>;
};

function normalizeFeatures(plan: any): string[] {
  if (Array.isArray(plan?.featureFlags) && plan.featureFlags.length) {
    return plan.featureFlags.map((flag: string) => String(flag).toLowerCase());
  }
  if ((plan?.tier ?? '').toString().toLowerCase() === 'advanced') {
    return ['vip', 'package', 'priority-support'];
  }
  return ['hourly', 'receipt-printing'];
}

function normalizeDeviceLimit(plan: any): number {
  if (Number.isFinite(Number(plan?.deviceLimit))) {
    return Number(plan.deviceLimit);
  }
  return (plan?.tier ?? '').toString().toLowerCase() === 'advanced' ? 8 : 3;
}

async function resolvePlanForUser(userId: string) {
  const subscription = await SubscriptionService.getSubscription(userId);
  const planId = subscription?.plan ? String(subscription.plan) : null;
  const plan = planId ? await planRepository.findById(planId) : null;
  return { plan };
}

function resolveRequestedUnits(req: GateRequest, getRequestedUnits?: PlanGateOptions['getRequestedUnits']): number {
  if (getRequestedUnits) {
    return Math.max(Number(getRequestedUnits(req)) || 0, 0);
  }
  if (Array.isArray(req.body?.categories)) {
    return req.body.categories.length;
  }
  return 1;
}

export function createPlanGate(options: PlanGateOptions = {}) {
  return async function planGate(req: GateRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.authData?.id;
      if (!userId) {
        throw new ValidationError('Authenticated user is required.');
      }

      const { plan } = await resolvePlanForUser(userId);
      const activePlan = plan ?? {
        tier: 'basic',
        deviceLimit: 3,
        featureFlags: ['hourly', 'receipt-printing'],
      };

      const availableFeatures = normalizeFeatures(activePlan);
      const deviceLimit = normalizeDeviceLimit(activePlan);

      if (options.requiredFeature) {
        const featureKey = options.requiredFeature.toLowerCase();
        if (!availableFeatures.includes(featureKey)) {
          throw new ValidationError(`Your current plan does not include the "${options.requiredFeature}" feature.`);
        }
      }

      const requestedUnits = resolveRequestedUnits(req, options.getRequestedUnits);
      const branchId = req.body?.brancheId;

      if (branchId && requestedUnits > 0) {
        const existingSessions = await sessionRepository.find(
          { brancheId: new Types.ObjectId(String(branchId)) },
          {
            scope: {
              tenantId: req.authData?.tenantId ?? null,
              requireTenant: Boolean(req.authData?.tenantId),
            },
          }
        );
        const activeDevices = existingSessions.reduce((total, session) => {
          if (!session?.activeState) {
            return total;
          }
          return total + (Array.isArray(session.categories) ? session.categories.filter((category: any) => !category.endTime).length : 0);
        }, 0);

        if (activeDevices + requestedUnits > deviceLimit) {
          throw new ValidationError(
            `Your current plan allows ${deviceLimit} devices, but this action would use ${activeDevices + requestedUnits}.`
          );
        }
      }

      next();
    } catch (error: any) {
      res.status(403).json({
        success: false,
        errors: [error?.message ?? 'Plan gate blocked the request.'],
        status: 403,
        message: error?.message ?? 'Plan gate blocked the request.',
      });
    }
  };
}
