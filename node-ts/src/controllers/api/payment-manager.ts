import { Request, Response } from 'express';
import { PaymentMethod, PaymentProvider } from '../../enums';
import { ValidationError } from '../../errors/AppError';
import PaymentService from '../../services/payment.service';
import { IPaymentService } from '../../services/interfaces/IPaymentService';
import { SendResponse } from '../base/sendResponse';

interface AuthRequest extends Request {
  authData?: {
    id: string;
  };
}

class PaymentManager extends SendResponse {
  constructor(private readonly paymentService: IPaymentService = PaymentService) {
    super();
  }

  initiate = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.authData?.id;
    if (!userId) {
      throw new ValidationError('Authenticated user is required.');
    }

    const checkout = await this.paymentService.initiate({
      userId,
      planId: req.body.planId,
      provider: req.body.provider as PaymentProvider,
      method: req.body.method as PaymentMethod,
      idempotencyKey: req.header('Idempotency-Key') ?? undefined,
    });

    this.sendResponse(req, res, 201, [checkout], 1);
  };

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.authData?.id;
    if (!userId) {
      throw new ValidationError('Authenticated user is required.');
    }

    const payments = await this.paymentService.listUserPayments(userId);
    this.sendResponse(req, res, 200, payments, payments.length);
  };

  getById = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.authData?.id;
    if (!userId) {
      throw new ValidationError('Authenticated user is required.');
    }

    const payment = await this.paymentService.getPayment(req.params.id, userId);
    this.sendResponse(req, res, 200, payment ? [payment] : [], payment ? 1 : 0);
  };
}

export default PaymentManager;
