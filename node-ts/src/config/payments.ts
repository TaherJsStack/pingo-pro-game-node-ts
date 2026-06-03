import { config } from 'dotenv';
import { env, envValue, parseBooleanValue } from './env';

config();

type PaypalMode = 'sandbox' | 'live';

export interface PaymentsConfig {
  enabled: boolean;
  appBaseUrl: string;
  defaultCurrency: string;
  paypal: {
    clientId: string;
    clientSecret: string;
    mode: PaypalMode;
    webhookId: string;
  };
  paymob: {
    apiKey: string;
    secretKey: string;
    publicKey: string;
    hmacSecret: string;
    iframeId: string;
    integrationIds: {
      card: string;
      wallet: string;
    };
    baseUrl: string;
  };
}

function requireEnv(source: NodeJS.ProcessEnv | Record<string, string | undefined>, key: string, missing: string[]): string {
  const value = envValue(source, key);
  if (!value) {
    missing.push(key);
  }
  return value;
}

function normalizePaypalMode(value: string): PaypalMode {
  return value === 'live' ? 'live' : 'sandbox';
}

export function loadPaymentsConfig(source: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env): PaymentsConfig {
  const missing: string[] = [];
  const enabled = parseBooleanValue(envValue(source, 'PAYMENTS_ENABLED'), env.paymentsEnabled);

  const loaded: PaymentsConfig = {
    enabled,
    appBaseUrl: (envValue(source, 'APP_BASE_URL') || env.appBaseUrl).replace(/\/+$/, ''),
    defaultCurrency: envValue(source, 'DEFAULT_CURRENCY') || 'EGP',
    paypal: {
      clientId: enabled ? requireEnv(source, 'PAYPAL_CLIENT_ID', missing) : envValue(source, 'PAYPAL_CLIENT_ID'),
      clientSecret: enabled ? requireEnv(source, 'PAYPAL_CLIENT_SECRET', missing) : envValue(source, 'PAYPAL_CLIENT_SECRET'),
      mode: normalizePaypalMode(envValue(source, 'PAYPAL_MODE')),
      webhookId: enabled ? requireEnv(source, 'PAYPAL_WEBHOOK_ID', missing) : envValue(source, 'PAYPAL_WEBHOOK_ID'),
    },
    paymob: {
      apiKey: enabled ? requireEnv(source, 'PAYMOB_API_KEY', missing) : envValue(source, 'PAYMOB_API_KEY'),
      secretKey: enabled ? requireEnv(source, 'PAYMOB_SECRET_KEY', missing) : envValue(source, 'PAYMOB_SECRET_KEY'),
      publicKey: enabled ? requireEnv(source, 'PAYMOB_PUBLIC_KEY', missing) : envValue(source, 'PAYMOB_PUBLIC_KEY'),
      hmacSecret: enabled ? requireEnv(source, 'PAYMOB_HMAC_SECRET', missing) : envValue(source, 'PAYMOB_HMAC_SECRET'),
      iframeId: enabled ? requireEnv(source, 'PAYMOB_IFRAME_ID', missing) : envValue(source, 'PAYMOB_IFRAME_ID'),
      integrationIds: {
        card: enabled ? requireEnv(source, 'PAYMOB_INTEGRATION_ID_CARD', missing) : envValue(source, 'PAYMOB_INTEGRATION_ID_CARD'),
        wallet: enabled ? requireEnv(source, 'PAYMOB_INTEGRATION_ID_WALLET', missing) : envValue(source, 'PAYMOB_INTEGRATION_ID_WALLET'),
      },
      baseUrl: envValue(source, 'PAYMOB_BASE_URL') || 'https://accept.paymob.com/api',
    },
  };

  if (missing.length > 0) {
    throw new Error(`Missing payment configuration: ${missing.join(', ')}`);
  }

  return Object.freeze(loaded);
}

export const paymentsConfig = loadPaymentsConfig();
