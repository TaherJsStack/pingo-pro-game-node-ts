import { Document, Types } from 'mongoose';
import { IdempotencyStatus } from '../../enums/idempotency-status.enum';

export interface IIdempotencySnapshot {
  statusCode: number;
  body: any;
}

export interface IIdempotencyKey extends Document {
  tenantId: Types.ObjectId;
  key: string;
  route: string;
  requestHash: string;
  status: IdempotencyStatus;
  responseSnapshot?: IIdempotencySnapshot | null;
  createdAt: Date;
  expiresAt: Date;
}
