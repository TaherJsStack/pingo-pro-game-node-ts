import { PaymentProvider } from '../../enums';
import { ValidationError } from '../../errors/AppError';
import { IPaymentProvider } from '../../services/interfaces/IPaymentProvider';
import { PaymobProvider } from './PaymobProvider';
import { PaypalProvider } from './PaypalProvider';

export class PaymentProviderFactory {
  constructor(
    private readonly paypalProvider: IPaymentProvider = new PaypalProvider(),
    private readonly paymobProvider: IPaymentProvider = new PaymobProvider()
  ) {}

  get(provider: PaymentProvider): IPaymentProvider {
    switch (provider) {
      case PaymentProvider.Paypal:
        return this.paypalProvider;
      case PaymentProvider.Paymob:
        return this.paymobProvider;
      default:
        throw new ValidationError(`Unsupported payment provider: ${provider}`);
    }
  }
}

export const paymentProviderFactory = new PaymentProviderFactory();
