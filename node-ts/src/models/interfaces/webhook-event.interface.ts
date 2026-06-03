import { PaymentProvider } from '../../enums';
import { ActivityFields, BaseEntity } from './common.interface';

export type WebhookEventStatus = 'received' | 'processed' | 'failed';

export interface IWebhookEvent extends BaseEntity, ActivityFields {
  provider: PaymentProvider;
  providerEventId: string;
  eventType: string;
  payload: unknown;
  status: WebhookEventStatus;
  error?: string;
  receivedAt: Date;
  processedAt?: Date;
}
