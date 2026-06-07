import { NotificationChannel } from '../enums/notification-channel.enum';

export interface NotificationProviderSendInput {
  tenantId: string;
  recipient: string;
  renderedMessage: string;
  payload: Record<string, any>;
  eventType: string;
}

export interface NotificationProviderSendResult {
  providerMessageId?: string;
  raw?: unknown;
}

export interface NotificationProviderAdapter {
  readonly channel: NotificationChannel;
  send(input: NotificationProviderSendInput): Promise<NotificationProviderSendResult>;
}
