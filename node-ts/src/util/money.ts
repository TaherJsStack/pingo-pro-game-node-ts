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

/**
 * Single source of truth for what a device session is charged:
 * elapsed hours (server-stamped startTime → endTime) × hourly price, rounded.
 * Returns 0 for an open/unfinished session (no endTime) or a non-positive duration.
 * Used by both invoice totals and analytics so the two can never drift.
 */
export function deviceCharge(device: {
  startTime?: string | Date | null;
  endTime?: string | Date | null;
  price?: number | string | null;
}): number {
  if (!device?.startTime || !device?.endTime) {
    return 0;
  }

  const startTime = device.startTime instanceof Date ? device.startTime : new Date(device.startTime);
  const endTime = device.endTime instanceof Date ? device.endTime : new Date(device.endTime);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  if (!Number.isFinite(durationHours) || durationHours <= 0) {
    return 0;
  }

  return roundMoney(durationHours * Number(device.price ?? 0));
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
