import mongoose, { Schema } from 'mongoose';
import { IdempotencyStatus } from '../enums/idempotency-status.enum';
import { IIdempotencyKey } from './interfaces/idempotency-key.interface';

const idempotencyKeySchema: Schema<IIdempotencyKey> = new Schema<IIdempotencyKey>(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    key: { type: String, required: true, trim: true },
    route: { type: String, required: true, trim: true },
    requestHash: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: Object.values(IdempotencyStatus),
      default: IdempotencyStatus.InProgress,
      index: true,
    },
    responseSnapshot: { type: Schema.Types.Mixed, default: null },
    expiresAt: { type: Date, required: true, index: true },
  },
  {
    timestamps: true,
  }
);

idempotencyKeySchema.index({ tenantId: 1, key: 1 }, { unique: true });
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IIdempotencyKey>('IdempotencyKey', idempotencyKeySchema);
