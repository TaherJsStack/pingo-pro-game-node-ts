import { Request, Response } from 'express';
import BillingService from '../../services/billing.service';
import PaymentService from '../../services/payment.service';
import { IBillingService } from '../../services/interfaces/IBillingService';
import { IPaymentService } from '../../services/interfaces/IPaymentService';
import { ValidationError } from '../../errors/AppError';
import { SendResponse } from '../base/sendResponse';

export class BillingController extends SendResponse {
  constructor(
    private readonly billingService: IBillingService = BillingService,
    private readonly paymentService: IPaymentService = PaymentService
  ) {
    super();
  }

  runDue = async (req: Request, res: Response): Promise<void> => {
    await this.billingService.processDueRenewals(new Date());
    this.sendResponse(req, res, 200, [{ queued: true, job: 'run-due' }], 1);
  };

  reconcile = async (req: Request, res: Response): Promise<void> => {
    await this.billingService.reconcilePendingPayments(new Date());
    this.sendResponse(req, res, 200, [{ queued: true, job: 'reconcile' }], 1);
  };

  replayWebhook = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.id;
    if (!eventId) {
      throw new ValidationError('Webhook event id is required.');
    }
    await this.paymentService.replayWebhookEvent(eventId);
    this.sendResponse(req, res, 200, [{ replayed: true, webhookEventId: eventId }], 1);
  };
}
