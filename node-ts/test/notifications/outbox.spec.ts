import mongoose from 'mongoose';
import SettingsModel from '../../src/models/settings';
import NotificationOutboxModel from '../../src/models/notification-outbox';
import { NotificationChannel, NotificationEventType } from '../../src/enums';

describe('notification outbox', () => {
  const tenantId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    await SettingsModel.deleteMany({});
    await NotificationOutboxModel.deleteMany({});
  });

  it('enqueues tenant-scoped rows without blocking the caller', async () => {
    await SettingsModel.create({
      ownerId: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      tenantId,
      theme: 'default',
      language: 'ar',
      description: 'tenant settings',
      notifications: {
        enabled: true,
        channels: [NotificationChannel.Telegram, NotificationChannel.WhatsApp],
        whatsappNumber: '+201000000000',
        telegramChatId: '123456',
        shiftOpened: true,
        shiftClosed: true,
        tableClosed: true,
        dailySummary: false,
        tableCloseThreshold: 250,
      },
    });

    const { default: NotificationService } = await import('../../src/services/notification.service');
    const rows = await NotificationService.queueShiftOpened({
      tenantId: String(tenantId),
      shiftId: 'shift-1',
      openingCash: 150,
    });

    expect(rows).toHaveLength(2);

    const stored = await NotificationOutboxModel.find({ tenantId }).lean();
    expect(stored).toHaveLength(2);
    expect(stored[0].status).toBe('pending');
    expect(stored[0].eventType).toBe(NotificationEventType.ShiftOpened);
    expect(stored[0].renderedMessage).toContain('تم فتح الشفت');
  });

  it('returns no rows when notifications are disabled', async () => {
    await SettingsModel.create({
      ownerId: new mongoose.Types.ObjectId(),
      createdBy: new mongoose.Types.ObjectId(),
      tenantId,
      theme: 'default',
      language: 'ar',
      description: 'tenant settings',
      notifications: {
        enabled: false,
        channels: [NotificationChannel.Telegram],
        telegramChatId: '123456',
        whatsappNumber: '',
        shiftOpened: true,
        shiftClosed: true,
        tableClosed: true,
        dailySummary: false,
        tableCloseThreshold: 0,
      },
    });

    const { default: NotificationService } = await import('../../src/services/notification.service');
    const rows = await NotificationService.queueTableClosed({
      tenantId: String(tenantId),
      tableName: 'VIP 1',
      total: 500,
    });

    expect(rows).toHaveLength(0);
    expect(await NotificationOutboxModel.countDocuments({ tenantId })).toBe(0);
  });
});
