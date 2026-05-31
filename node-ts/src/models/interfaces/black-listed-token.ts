import { BaseEntity } from './common.interface';

export interface IBlacklistedToken extends BaseEntity {
  token: string;
  expiresAt: Date;
}
