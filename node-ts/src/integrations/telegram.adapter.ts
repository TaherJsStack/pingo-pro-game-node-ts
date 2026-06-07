import { NotificationChannel } from '../enums/notification-channel.enum';
import { envValue } from '../config/env';
import { NotificationProviderAdapter, NotificationProviderSendInput, NotificationProviderSendResult } from './notification-provider.interface';

class TelegramAdapter implements NotificationProviderAdapter {
  readonly channel = NotificationChannel.Telegram;

  private readonly botToken = envValue(process.env, 'TELEGRAM_BOT_TOKEN');
  private readonly apiBaseUrl = envValue(process.env, 'TELEGRAM_API_BASE_URL') || 'https://api.telegram.org';

  async send(input: NotificationProviderSendInput): Promise<NotificationProviderSendResult> {
    if (!this.botToken) {
      throw new Error('Telegram bot token is not configured.');
    }

    const response = await fetch(`${this.apiBaseUrl}/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: input.recipient,
        text: input.renderedMessage,
        disable_web_page_preview: true,
      }),
    });

    const raw = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(raw?.description || `Telegram send failed with status ${response.status}`);
    }

    return {
      providerMessageId: raw?.result?.message_id ? String(raw.result.message_id) : undefined,
      raw,
    };
  }
}

export default new TelegramAdapter();
