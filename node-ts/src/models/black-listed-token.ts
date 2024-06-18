import mongoose, { Schema, Document } from 'mongoose';
import { IBlacklistedToken } from './interfaces/black-listed-token';

const BlacklistedTokenSchema: Schema = new Schema<IBlacklistedToken>({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
});

const BlacklistedToken = mongoose.model<IBlacklistedToken>('BlacklistedToken', BlacklistedTokenSchema);

export default BlacklistedToken;
