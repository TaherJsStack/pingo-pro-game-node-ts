import { ActivityFields, BaseEntity } from './common.interface';

export interface IPlanExternalIds {
  paypalPlanId?: string;
  paypalProductId?: string;
}

export interface IPlan extends BaseEntity, ActivityFields {
  tier?: 'basic' | 'advanced';
  name: string;
  price: number;
  durationMonths: number;
  amountMinor: number;
  currency: string;
  billingIntervalMonths: number;
  deviceLimit?: number;
  featureFlags?: string[];
  externalIds?: IPlanExternalIds;
}
