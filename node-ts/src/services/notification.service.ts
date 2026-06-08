import { Types } from 'mongoose';
import SettingsModel from '../models/settings';
import NotificationOutboxModel from '../models/notification-outbox';
import TenantModel from '../models/tenant';
import InboxModel from '../models/inbox';
import { ISettings } from '../models/interfaces/settings.interface';
import { NotificationChannel, NotificationEventType } from '../enums';
import { InboxType } from '../enums/inbox-type.enum';
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

    // Single per-event gate that controls both fan-out targets (in-app inbox
    // and external channels), so a business event is enabled/disabled in one place.
    if (!this.isEventEnabled(notificationSettings, input.eventType)) {
      return [];
    }

    const locale = input.locale ?? (settings?.language === 'en' ? 'en' : 'ar');
    const payload = {
      ...input.payload,
      currency: input.payload.currency ?? 'EGP',
    };

    const renderedMessage = renderNotificationTemplate(input.eventType, payload, locale);

    // Fan-out #1 — in-app inbox. Independent of external channel config so the
    // owner always sees the event inside the app even with no WhatsApp/Telegram set up.
    await this.fanoutToInbox(tenantObjectId, input.eventType, renderedMessage, locale);

    // Fan-out #2 — external channels (WhatsApp / Telegram) via the outbox queue.
    const recipients = this.resolveRecipients(notificationSettings);
    if (!recipients.length) {
      return [];
    }

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

  private async fanoutToInbox(
    tenantId: Types.ObjectId,
    eventType: NotificationEventType,
    renderedMessage: string,
    locale: 'ar' | 'en',
  ): Promise<void> {
    try {
      const tenant = await TenantModel.findById(tenantId).select('ownerId').lean();
      if (!tenant?.ownerId) {
        return;
      }

      await InboxModel.create({
        ownerId: tenant.ownerId,
        tenantId,
        title: this.resolveInboxTitle(eventType, locale),
        type: InboxType.Notification,
        context: renderedMessage,
      });
    } catch (error) {
      // In-app inbox is best-effort: never let it block external delivery.
      console.warn('Notification inbox fan-out failed:', error);
    }
  }

  private resolveInboxTitle(eventType: NotificationEventType, locale: 'ar' | 'en'): string {
    const titles: Record<NotificationEventType, { ar: string; en: string }> = {
      [NotificationEventType.ShiftOpened]: { ar: 'تم فتح الشفت', en: 'Shift opened' },
      [NotificationEventType.ShiftClosed]: { ar: 'تم تقفيل الشفت', en: 'Shift closed' },
      [NotificationEventType.TableClosed]: { ar: 'تم إغلاق الطاولة', en: 'Table closed' },
      [NotificationEventType.DailySummary]: { ar: 'التقرير اليومي', en: 'Daily summary' },
    };
    return titles[eventType]?.[locale] ?? (locale === 'en' ? 'Notification' : 'تنبيه');
  }

  private resolveRecipients(
    settings: NonNullable<ISettings['notifications']>,
  ): Array<{ channel: NotificationChannel; value: string }> {
    const recipients: Array<{ channel: NotificationChannel; value: string }> = [];

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
