import { ActivityFields, BaseEntity, ObjectId } from './common.interface';

export interface IAnalyticsEvent extends BaseEntity, ActivityFields {
  tenantId: ObjectId;
  brancheId: ObjectId;
  shiftId?: ObjectId | null;
  sessionId?: ObjectId | null;
  invoiceId?: ObjectId | null;
  deviceType: string;
  eventType: string;
  amount: number;
  occurredAt: Date;
  metadata?: Record<string, unknown>;
}
