import { Request, Response } from 'express';
import { ValidationError } from '../../errors/AppError';
import PaymentMethodService, { PaymentMethodService as PaymentMethodServiceClass } from '../../services/payment-method.service';
import { SendResponse } from '../base/sendResponse';
import { toPublicPaymentMethod } from '../../util/redact';

interface AuthRequest extends Request {
  authData?: {
    id: string;
  };
}

class PaymentMethodManager extends SendResponse {
  constructor(private readonly service: PaymentMethodServiceClass = PaymentMethodService) {
    super();
  }

  private requireUser(req: AuthRequest): string {
    const userId = req.authData?.id;
    if (!userId) {
      throw new ValidationError('Authenticated user is required.');
    }
    return userId;
  }

  list = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = this.requireUser(req);
    const methods = await this.service.listForUser(userId);
    const masked = methods.map(toPublicPaymentMethod);
    this.sendResponse(req, res, 200, masked, masked.length);
  };

  setDefault = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = this.requireUser(req);
    const updated = await this.service.setDefault(req.params.id, userId);
    this.sendResponse(req, res, 200, updated ? [toPublicPaymentMethod(updated)] : [], updated ? 1 : 0);
  };

  deactivate = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = this.requireUser(req);
    const updated = await this.service.deactivate(req.params.id, userId);
    this.sendResponse(req, res, 200, updated ? [toPublicPaymentMethod(updated)] : [], updated ? 1 : 0);
  };
}

export default PaymentMethodManager;
