const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

function currencyFactor(currency = 'EGP'): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase()) ? 1 : 100;
}

export function toMinor(amount: number | string, currency = 'EGP'): number {
  const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(numericAmount)) {
    throw new Error('Invalid money amount');
  }

  return Math.round(numericAmount * currencyFactor(currency));
}

export function fromMinor(amountMinor: number, currency = 'EGP'): number {
  if (!Number.isInteger(amountMinor)) {
    throw new Error('Minor money amount must be an integer');
  }

  return amountMinor / currencyFactor(currency);
}
