import { Request, Response } from 'express';
import BillingService from '../../services/billing.service';
import { IBillingService } from '../../services/interfaces/IBillingService';
import { SendResponse } from '../base/sendResponse';

export class BillingController extends SendResponse {
  constructor(private readonly billingService: IBillingService = BillingService) {
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
}
