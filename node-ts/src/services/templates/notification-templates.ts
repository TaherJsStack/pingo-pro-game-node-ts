import { NotificationEventType } from '../../enums/notification-event-type.enum';

type TemplateLocale = 'ar' | 'en';

export interface NotificationTemplatePayload {
  shiftId?: string;
  shiftLabel?: string;
  tableName?: string;
  total?: number;
  workedMinutes?: number;
  openingCash?: number;
  closingCash?: number;
  timestamp?: string;
  currency?: string;
  [key: string]: any;
}

export function renderNotificationTemplate(
  eventType: NotificationEventType,
  payload: NotificationTemplatePayload,
  locale: TemplateLocale = 'ar',
): string {
  const currency = payload.currency ?? 'EGP';

  if (locale === 'en') {
    switch (eventType) {
      case NotificationEventType.ShiftOpened:
        return `Shift opened${payload.shiftLabel ? ` for ${payload.shiftLabel}` : ''}${payload.openingCash !== undefined ? ` with opening cash ${payload.openingCash} ${currency}` : ''}.`;
      case NotificationEventType.ShiftClosed:
        return `Shift closed${payload.shiftLabel ? ` for ${payload.shiftLabel}` : ''}${payload.total !== undefined ? ` with total ${payload.total} ${currency}` : ''}${payload.workedMinutes !== undefined ? ` after ${payload.workedMinutes} minutes` : ''}.`;
      case NotificationEventType.TableClosed:
        return `Table ${payload.tableName ?? 'unknown'} closed${payload.total !== undefined ? ` with total ${payload.total} ${currency}` : ''}.`;
      case NotificationEventType.DailySummary:
        return `Daily summary is ready${payload.total !== undefined ? `: ${payload.total} ${currency}` : ''}.`;
      default:
        return 'Notification';
    }
  }

  switch (eventType) {
    case NotificationEventType.ShiftOpened:
      return `تم فتح الشفت${payload.shiftLabel ? ` ${payload.shiftLabel}` : ''}${payload.openingCash !== undefined ? ` برصيد افتتاحي ${payload.openingCash} ${currency}` : ''}.`;
    case NotificationEventType.ShiftClosed:
      return `تم تقفيل الشفت${payload.shiftLabel ? ` ${payload.shiftLabel}` : ''}${payload.total !== undefined ? ` بإجمالي ${payload.total} ${currency}` : ''}${payload.workedMinutes !== undefined ? ` بعد ${payload.workedMinutes} دقيقة` : ''}.`;
    case NotificationEventType.TableClosed:
      return `تم إغلاق الطاولة ${payload.tableName ?? 'غير معروفة'}${payload.total !== undefined ? ` بإجمالي ${payload.total} ${currency}` : ''}.`;
    case NotificationEventType.DailySummary:
      return `التقرير اليومي جاهز${payload.total !== undefined ? `: ${payload.total} ${currency}` : ''}.`;
    default:
      return 'تنبيه';
  }
}
