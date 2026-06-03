import { ActivityFields, BaseEntity } from './common.interface';

export interface IPlanExternalIds {
  paypalPlanId?: string;
  paypalProductId?: string;
}

export interface IPlan extends BaseEntity, ActivityFields {
  name: string;
  price: number;
  durationMonths: number;
  amountMinor: number;
  currency: string;
  billingIntervalMonths: number;
  externalIds?: IPlanExternalIds;
}
