import { Types } from 'mongoose';
import SettingsModel from '../models/settings';
import NotificationOutboxModel from '../models/notification-outbox';
import { ISettings } from '../models/interfaces/settings.interface';
import { NotificationChannel, NotificationEventType } from '../enums';
import { NotificationTemplatePayload, renderNotificationTemplate } from './templates/notification-templates';

export interface QueueNotificationInput {
  tenantId: string;
  eventType: NotificationEventType;
  payload: NotificationTemplatePayload;
  locale?: 'ar' | 'en';
}

class NotificationService {
  async queueNotification(input: QueueNotificationInput): Promise<Array<any>> {
    const tenantObjectId = new Types.ObjectId(input.tenantId);
    const settings = await SettingsModel.findOne({ tenantId: tenantObjectId, activeState: true }).lean();
    const notificationSettings = settings?.notifications;

    if (!notificationSettings?.enabled) {
      return [];
    }

    const locale = input.locale ?? (settings?.language === 'en' ? 'en' : 'ar');
    const payload = {
      ...input.payload,
      currency: input.payload.currency ?? 'EGP',
    };

    const recipients = this.resolveRecipients(notificationSettings, input.eventType);
    if (!recipients.length) {
      return [];
    }

    const renderedMessage = renderNotificationTemplate(input.eventType, payload, locale);
    const scheduledAt = new Date();

    const rows = await NotificationOutboxModel.insertMany(
      recipients.map((recipient) => ({
        tenantId: tenantObjectId,
        channel: recipient.channel,
        eventType: input.eventType,
        recipient: recipient.value,
        renderedMessage,
        payload,
        status: 'pending',
        attempts: 0,
        lastError: null,
        scheduledAt,
        sentAt: null,
        activeState: true,
        description: `${input.eventType} notification`,
      }))
    );

    return rows;
  }

  async queueShiftOpened(payload: { tenantId: string; shiftId: string; shiftLabel?: string; openingCash?: number }): Promise<Array<any>> {
    return this.queueNotification({
      tenantId: payload.tenantId,
      eventType: NotificationEventType.ShiftOpened,
      payload: {
        shiftId: payload.shiftId,
        shiftLabel: payload.shiftLabel,
        openingCash: payload.openingCash,
      },
    });
  }

  async queueShiftClosed(payload: { tenantId: string; shiftId: string; shiftLabel?: string; total?: number; workedMinutes?: number; closingCash?: number }): Promise<Array<any>> {
    return this.queueNotification({
      tenantId: payload.tenantId,
      eventType: NotificationEventType.ShiftClosed,
      payload: {
        shiftId: payload.shiftId,
        shiftLabel: payload.shiftLabel,
        total: payload.total,
        workedMinutes: payload.workedMinutes,
        closingCash: payload.closingCash,
      },
    });
  }

  async queueTableClosed(payload: { tenantId: string; tableName?: string; total: number }): Promise<Array<any>> {
    return this.queueNotification({
      tenantId: payload.tenantId,
      eventType: NotificationEventType.TableClosed,
      payload: {
        tableName: payload.tableName,
        total: payload.total,
      },
    });
  }

  private resolveRecipients(
    settings: NonNullable<ISettings['notifications']>,
    eventType: NotificationEventType,
  ): Array<{ channel: NotificationChannel; value: string }> {
    const recipients: Array<{ channel: NotificationChannel; value: string }> = [];
    const eventEnabled = this.isEventEnabled(settings, eventType);
    if (!eventEnabled) {
      return recipients;
    }

    if (settings.channels.includes(NotificationChannel.WhatsApp) && settings.whatsappNumber) {
      recipients.push({ channel: NotificationChannel.WhatsApp, value: settings.whatsappNumber });
    }

    if (settings.channels.includes(NotificationChannel.Telegram) && settings.telegramChatId) {
      recipients.push({ channel: NotificationChannel.Telegram, value: settings.telegramChatId });
    }

    return recipients;
  }

  private isEventEnabled(
    settings: NonNullable<ISettings['notifications']>,
    eventType: NotificationEventType,
  ): boolean {
    switch (eventType) {
      case NotificationEventType.ShiftOpened:
        return Boolean(settings.shiftOpened);
      case NotificationEventType.ShiftClosed:
        return Boolean(settings.shiftClosed);
      case NotificationEventType.TableClosed:
        return Boolean(settings.tableClosed);
      case NotificationEventType.DailySummary:
        return Boolean(settings.dailySummary);
      default:
        return false;
    }
  }
}

export default new NotificationService();
