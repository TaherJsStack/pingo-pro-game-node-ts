export interface IBlacklistedToken extends Document {
    token: string;
    expiresAt: Date;
  }