import { IRepository } from '../repositories';
import { paymentInstrumentRepository } from '../repositories/instances';
import { IPaymentInstrument } from '../models/interfaces/payment-instrument.interface';
import { NotFoundError, ValidationError } from '../errors/AppError';

/**
 * User-owned saved payment instruments (cards / provider subscriptions). All reads are masked by
 * the controller via `toPublicPaymentMethod` — this service never returns raw tokens to callers.
 */
class PaymentMethodService {
  constructor(
    private readonly instruments: IRepository<IPaymentInstrument> = paymentInstrumentRepository
  ) {}

  async listForUser(userId: string): Promise<IPaymentInstrument[]> {
    return this.instruments.find({ userId, activeState: true }, { sort: { createdAt: -1 } });
  }

  private async assertOwned(instrumentId: string, userId: string): Promise<IPaymentInstrument> {
    const instrument = await this.instruments.findById(instrumentId);
    if (!instrument) {
      throw new NotFoundError('Payment method not found.');
    }
    if (String(instrument.userId) !== String(userId)) {
      throw new ValidationError('Payment method does not belong to the authenticated user.');
    }
    return instrument;
  }

  async setDefault(instrumentId: string, userId: string): Promise<IPaymentInstrument | null> {
    await this.assertOwned(instrumentId, userId);
    // Only one default per user.
    await this.instruments.updateMany({ userId }, { $set: { isDefault: false } });
    return this.instruments.updateById(instrumentId, { isDefault: true } as any);
  }

  async deactivate(instrumentId: string, userId: string): Promise<IPaymentInstrument | null> {
    await this.assertOwned(instrumentId, userId);
    return this.instruments.updateById(instrumentId, { activeState: false, isDefault: false } as any);
  }
}

export { PaymentMethodService };
export default new PaymentMethodService();
