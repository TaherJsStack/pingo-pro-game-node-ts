import { ValidationError } from '../errors/AppError';

const ALLOWED_CLOCK_SKEW_MS = 2 * 60 * 1000;

function toDate(value: unknown): Date | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value as string);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveEndTime(clientValue?: unknown, startTime?: unknown): Date {
  const now = new Date();
  const requestedEndTime = toDate(clientValue) ?? now;
  const resolvedStartTime = toDate(startTime);
  const maxAllowedTime = new Date(now.getTime() + ALLOWED_CLOCK_SKEW_MS);

  if (requestedEndTime > maxAllowedTime) {
    throw new ValidationError('endTime cannot be in the future.');
  }

  const resolvedEndTime = requestedEndTime > now ? now : requestedEndTime;

  if (resolvedStartTime && resolvedEndTime < resolvedStartTime) {
    throw new ValidationError('endTime cannot be earlier than startTime.');
  }

  return resolvedEndTime;
}
