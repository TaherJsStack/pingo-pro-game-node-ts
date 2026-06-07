import { NotificationChannel } from '../enums/notification-channel.enum';
import { envValue } from '../config/env';
import { NotificationProviderAdapter, NotificationProviderSendInput, NotificationProviderSendResult } from './notification-provider.interface';

class WhatsAppAdapter implements NotificationProviderAdapter {
  readonly channel = NotificationChannel.WhatsApp;

  private readonly accessToken = envValue(process.env, 'WHATSAPP_ACCESS_TOKEN');
  private readonly phoneNumberId = envValue(process.env, 'WHATSAPP_PHONE_NUMBER_ID');
  private readonly apiBaseUrl = envValue(process.env, 'WHATSAPP_API_BASE_URL') || 'https://graph.facebook.com/v20.0';

  async send(input: NotificationProviderSendInput): Promise<NotificationProviderSendResult> {
    if (!this.accessToken || !this.phoneNumberId) {
      throw new Error('WhatsApp credentials are not configured.');
    }

    const response = await fetch(`${this.apiBaseUrl}/${this.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: input.recipient,
        type: 'text',
        text: {
          body: input.renderedMessage,
        },
      }),
    });

    const raw = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(raw?.error?.message || `WhatsApp send failed with status ${response.status}`);
    }

    return {
      providerMessageId: raw?.messages?.[0]?.id ? String(raw.messages[0].id) : undefined,
      raw,
    };
  }
}

export default new WhatsAppAdapter();
