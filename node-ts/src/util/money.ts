export function roundMoney(value: number | string | null | undefined, precision = 2): number {
  const normalized = Number(value ?? 0);
  if (!Number.isFinite(normalized)) {
    return 0;
  }

  return Number(normalized.toFixed(precision));
}

export function sumMoney(values: Array<number | string | null | undefined>): number {
  return roundMoney(values.reduce<number>((total, value) => total + Number(value ?? 0), 0));
}

export function toMinor(amount: number | string | null | undefined, currency = 'EGP'): number {
  const normalized = Number(amount ?? 0);
  if (!Number.isFinite(normalized)) {
    return 0;
  }

  const scale = currency.toUpperCase() === 'EGP' ? 100 : 1;
  return Math.round(normalized * scale);
}

export function fromMinor(amountMinor: number | string | null | undefined, currency = 'EGP'): number {
  const normalized = Number(amountMinor ?? 0);
  if (!Number.isFinite(normalized)) {
    return 0;
  }

  const scale = currency.toUpperCase() === 'EGP' ? 100 : 1;
  return roundMoney(normalized / scale);
}
