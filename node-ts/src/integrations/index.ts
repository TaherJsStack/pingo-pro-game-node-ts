import { NotificationChannel } from '../enums/notification-channel.enum';
import telegramAdapter from './telegram.adapter';
import whatsappAdapter from './whatsapp.adapter';
import { NotificationProviderAdapter } from './notification-provider.interface';

const adapters: Record<NotificationChannel, NotificationProviderAdapter> = {
  [NotificationChannel.Telegram]: telegramAdapter,
  [NotificationChannel.WhatsApp]: whatsappAdapter,
};

export function getNotificationAdapter(channel: NotificationChannel): NotificationProviderAdapter {
  const adapter = adapters[channel];
  if (!adapter) {
    throw new Error(`Unsupported notification channel: ${channel}`);
  }
  return adapter;
}

export { NotificationChannel };
