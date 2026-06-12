import { Response } from 'express';
import { PaymentMethod, PaymentProvider } from '../../enums';
import { ValidationError } from '../../errors/AppError';
import SubscriptionManager from './subscription-manager';
import PaymentService from '../../services/payment.service';
import { IPaymentService } from '../../services/interfaces/IPaymentService';
import { SendResponse } from '../base/sendResponse';
import { toPublicPayment } from '../../util/redact';
import { MaybeAuthenticatedRequest as AuthRequest } from '../../types/auth';

class PaymentManager extends SendResponse {
  constructor(
    private readonly paymentService: IPaymentService = PaymentService,
    private readonly subscriptionManager: SubscriptionManager = new SubscriptionManager()
  ) {
    super();
  }

  initiate = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.authData?.id;
    if (!userId) {
      throw new ValidationError('Authenticated user is required.');
    }
    const brancheId = req.authData?.brancheId;
    if (!brancheId) {
      throw new ValidationError('brancheId is required.');
    }

    const branch = await this.subscriptionManager.assertOwnedBranch(brancheId, userId);
    await this.subscriptionManager.assertFreePlanAvailable(userId, req.body.planId);
    const tenantId = branch.tenantId ? String(branch.tenantId) : req.authData?.tenantId ?? null;

    const checkout = await this.paymentService.initiate({
      userId,
      brancheId,
      tenantId,
      planId: req.body.planId,
      provider: req.body.provider as PaymentProvider,
      method: req.body.method as PaymentMethod,
      idempotencyKey: req.header('Idempotency-Key') ?? undefined,
      walletPhone: req.body.walletPhone ?? undefined,
    });

    this.sendResponse(req, res, 201, [checkout], 1);
  };

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.authData?.id;
    if (!userId) {
      throw new ValidationError('Authenticated user is required.');
    }

    const payments = await this.paymentService.listUserPayments(userId);
    const publicPayments = payments.map(toPublicPayment);
    this.sendResponse(req, res, 200, publicPayments, publicPayments.length);
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.authData?.id;
    if (!userId) {
      throw new ValidationError('Authenticated user is required.');
    }

    const payment = await this.paymentService.getPayment(req.params.id, userId);
    this.sendResponse(req, res, 200, payment ? [toPublicPayment(payment)] : [], payment ? 1 : 0);
  };
}

export default PaymentManager;
