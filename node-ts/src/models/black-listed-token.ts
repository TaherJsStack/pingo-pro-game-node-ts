import mongoose, { Schema } from 'mongoose';
import { IBlacklistedToken } from './interfaces/black-listed-token';

const BlacklistedTokenSchema: Schema = new Schema<IBlacklistedToken>({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

BlacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BlacklistedToken = mongoose.model<IBlacklistedToken>('BlacklistedToken', BlacklistedTokenSchema);

export default BlacklistedToken;
