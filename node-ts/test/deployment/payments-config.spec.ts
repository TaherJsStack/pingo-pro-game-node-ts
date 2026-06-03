import { loadPaymentsConfig } from '../../src/config/payments';

const baseEnv = {
  APP_BASE_URL: 'https://api.example.com',
};

describe('payments deployment config', () => {
  it('allows boot without provider credentials when payments are disabled', () => {
    const config = loadPaymentsConfig({
      ...baseEnv,
      PAYMENTS_ENABLED: 'false',
    });

    expect(config.enabled).toBe(false);
    expect(config.appBaseUrl).toBe('https://api.example.com');
    expect(config.defaultCurrency).toBe('EGP');
  });

  it('fails fast when payments are enabled without provider credentials', () => {
    expect(() =>
      loadPaymentsConfig({
        ...baseEnv,
        PAYMENTS_ENABLED: 'true',
      })
    ).toThrow('Missing payment configuration:');
  });

  it('loads provider credentials when payments are enabled', () => {
    const config = loadPaymentsConfig({
      ...baseEnv,
      PAYMENTS_ENABLED: 'true',
      DEFAULT_CURRENCY: 'USD',
      PAYPAL_CLIENT_ID: 'paypal-client',
      PAYPAL_CLIENT_SECRET: 'paypal-secret',
      PAYPAL_MODE: 'live',
      PAYPAL_WEBHOOK_ID: 'paypal-webhook',
      PAYMOB_API_KEY: 'paymob-api',
      PAYMOB_SECRET_KEY: 'paymob-secret',
      PAYMOB_PUBLIC_KEY: 'paymob-public',
      PAYMOB_HMAC_SECRET: 'paymob-hmac',
      PAYMOB_IFRAME_ID: '123',
      PAYMOB_INTEGRATION_ID_CARD: '456',
      PAYMOB_INTEGRATION_ID_WALLET: '789',
      PAYMOB_BASE_URL: 'https://paymob.example.com/api',
    });

    expect(config.enabled).toBe(true);
    expect(config.defaultCurrency).toBe('USD');
    expect(config.paypal.mode).toBe('live');
    expect(config.paymob.integrationIds.card).toBe('456');
  });
});
