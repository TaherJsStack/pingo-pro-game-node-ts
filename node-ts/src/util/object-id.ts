import { Types } from 'mongoose';
import { ValidationError } from '../errors/AppError';

export function assertObjectId(value: unknown, fieldName: string): Types.ObjectId {
  const normalizedValue = typeof value === 'string' ? value.trim() : String(value ?? '');

  if (!normalizedValue || !Types.ObjectId.isValid(normalizedValue)) {
    throw new ValidationError(`${fieldName} must be a valid ObjectId.`);
  }

  return new Types.ObjectId(normalizedValue);
}
