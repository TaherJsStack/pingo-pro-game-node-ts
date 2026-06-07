import mongoose from 'mongoose';
import NotificationOutboxModel from '../../src/models/notification-outbox';
import { NotificationChannel, NotificationEventType } from '../../src/enums';

const adapterSend = jest.fn();
const adapterFactory = jest.fn(() => ({
  send: adapterSend,
}));

let redisStore = new Map<string, string>();
const fakeRedisClient = {
  isOpen: true,
  connect: jest.fn(async () => undefined),
  on: jest.fn(),
  get: jest.fn(async (key: string) => redisStore.get(key) ?? null),
  set: jest.fn(async (key: string, value: string, options?: { NX?: boolean; EX?: number }) => {
    if (options?.NX && redisStore.has(key)) {
      return null;
    }
    redisStore.set(key, value);
    return 'OK';
  }),
  del: jest.fn(async (key: string) => {
    redisStore.delete(key);
    return 1;
  }),
  expire: jest.fn(async (key: string, seconds: number) => {
    return redisStore.has(key) && seconds > 0;
  }),
};

jest.mock('redis', () => ({
  createClient: jest.fn(() => fakeRedisClient),
}));

jest.mock('../../src/integrations', () => ({
  getNotificationAdapter: jest.fn(() => adapterFactory()),
  NotificationChannel,
}));

describe('notification dispatcher', () => {
  const tenantId = new mongoose.Types.ObjectId();

  beforeEach(async () => {
    redisStore = new Map<string, string>();
    adapterSend.mockReset();
    adapterFactory.mockClear();
    await NotificationOutboxModel.deleteMany({});
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.TELEGRAM_BOT_TOKEN = 'test-telegram';
    process.env.WHATSAPP_ACCESS_TOKEN = 'test-whatsapp';
    process.env.WHATSAPP_PHONE_NUMBER_ID = '123456';
  });

  it('marks a delivered notification as sent', async () => {
    adapterSend.mockResolvedValue({ providerMessageId: 'telegram-msg-1' });

    await NotificationOutboxModel.create({
      tenantId,
      channel: NotificationChannel.Telegram,
      eventType: NotificationEventType.ShiftOpened,
      recipient: '123456',
      renderedMessage: 'hello',
      payload: { shiftId: 'shift-1' },
      status: 'pending',
      attempts: 0,
      lastError: null,
      scheduledAt: new Date(Date.now() - 1000),
      sentAt: null,
      activeState: true,
      description: 'seed row',
    });

    const { runNotificationDispatcherOnce } = await import('../../src/jobs/notification-dispatcher');
    await runNotificationDispatcherOnce();

    const stored = await NotificationOutboxModel.findOne({ tenantId }).lean();
    expect(stored?.status).toBe('sent');
    expect(stored?.sentAt).toBeTruthy();
    expect(stored?.attempts).toBe(1);
    expect(adapterSend).toHaveBeenCalledWith(expect.objectContaining({
      recipient: '123456',
      renderedMessage: 'hello',
    }));
  });

  it('backs off and dead-letters after repeated failure', async () => {
    adapterSend.mockRejectedValue(new Error('provider down'));

    await NotificationOutboxModel.create({
      tenantId,
      channel: NotificationChannel.WhatsApp,
      eventType: NotificationEventType.TableClosed,
      recipient: '+201000000000',
      renderedMessage: 'table closed',
      payload: { total: 600 },
      status: 'pending',
      attempts: 4,
      lastError: null,
      scheduledAt: new Date(Date.now() - 1000),
      sentAt: null,
      activeState: true,
      description: 'seed row',
    });

    const { runNotificationDispatcherOnce } = await import('../../src/jobs/notification-dispatcher');
    await runNotificationDispatcherOnce();

    const stored = await NotificationOutboxModel.findOne({ tenantId }).lean();
    expect(stored?.status).toBe('dead_letter');
    expect(stored?.lastError).toContain('provider down');
    expect(stored?.scheduledAt).toBeNull();
    expect(stored?.attempts).toBe(5);
  });
});
