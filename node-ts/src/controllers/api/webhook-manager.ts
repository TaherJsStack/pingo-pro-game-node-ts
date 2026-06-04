import { Request, Response } from 'express';
import { PaymentProvider } from '../../enums';
import PaymentService from '../../services/payment.service';
import { IPaymentService } from '../../services/interfaces/IPaymentService';
import { SendResponse } from '../base/sendResponse';

class WebhookManager extends SendResponse {
  constructor(private readonly paymentService: IPaymentService = PaymentService) {
    super();
  }

  paypal = async (req: Request, res: Response): Promise<void> => {
    await this.recordAndAck(PaymentProvider.Paypal, req, res);
  };

  paymob = async (req: Request, res: Response): Promise<void> => {
    await this.recordAndAck(PaymentProvider.Paymob, req, res);
  };

  private async recordAndAck(provider: PaymentProvider, req: Request, res: Response): Promise<void> {
    const result = await this.paymentService.recordWebhook(provider, req);

    if (result.stored && result.webhookEventId) {
      const webhookEventId = result.webhookEventId;
      // Fast-ACK pattern: store then process async. Log failures (with provider + event id) so a
      // failed event can be found and replayed via the root replay endpoint — never swallow them.
      void this.paymentService.processWebhookEvent(webhookEventId).catch((error: any) => {
        console.error(
          `[webhook] async processing failed: provider=${provider} webhookEventId=${webhookEventId} error=${error?.message ?? error}`
        );
      });
    }

    this.sendResponse(req, res, 200, [{ received: true, duplicate: !result.stored }], 1);
  }
}

export default WebhookManager;
