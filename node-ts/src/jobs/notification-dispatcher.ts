import { createClient } from 'redis';
import { env } from '../config/env';
import NotificationOutboxModel from '../models/notification-outbox';
import { NotificationChannel, NotificationEventType } from '../enums';
import { getNotificationAdapter } from '../integrations';

interface DispatchableNotification {
  _id: string;
  tenantId: string;
  channel: NotificationChannel;
  eventType: NotificationEventType;
  recipient: string;
  renderedMessage: string;
  payload: Record<string, any>;
  attempts?: number;
  scheduledAt?: Date | string | null;
  status?: string;
}

const dispatcherLockKey = 'notification:dispatcher:lock';
const dispatcherWorkerId = `notification-dispatcher:${process.pid}:${Math.random().toString(36).slice(2)}`;
const dispatcherIntervalMs = 10000;
const lockTtlSeconds = 20;
const maxAttempts = 5;

let dispatcherStarted = false;
let dispatcherInterval: NodeJS.Timeout | null = null;
let redisClient: any = null;
let redisInitPromise: Promise<any | null> | null = null;
let dispatchInFlight = false;

async function getRedisClient(): Promise<any | null> {
  if (!env.redisUrl) {
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  if (redisInitPromise) {
    return redisInitPromise;
  }

  redisInitPromise = (async () => {
    const client = createClient({ url: env.redisUrl });
    client.on('error', (error) => {
      console.warn('Notification dispatcher Redis error:', error);
    });

    try {
      await client.connect();
      redisClient = client;
      return client;
    } catch (error) {
      console.warn('Notification dispatcher Redis unavailable:', error);
      redisClient = null;
      return null;
    }
  })().finally(() => {
    redisInitPromise = null;
  });

  return redisInitPromise;
}

async function acquireLock(client: any): Promise<boolean> {
  const result = await client.set(dispatcherLockKey, dispatcherWorkerId, {
    NX: true,
    EX: lockTtlSeconds,
  });
  return result === 'OK';
}

async function renewLock(client: any): Promise<void> {
  await client.expire(dispatcherLockKey, lockTtlSeconds);
}

async function releaseLock(client: any): Promise<void> {
  const current = await client.get(dispatcherLockKey);
  if (current === dispatcherWorkerId) {
    await client.del(dispatcherLockKey);
  }
}

function getRetryDelaySeconds(attempts: number): number {
  const baseDelay = Math.max(5, 2 ** Math.max(0, attempts - 1));
  return Math.min(3600, baseDelay);
}

async function loadPendingNotifications(limit = 20): Promise<DispatchableNotification[]> {
  return NotificationOutboxModel.find({
    status: { $in: ['pending', 'failed'] },
    scheduledAt: { $lte: new Date() },
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean<DispatchableNotification[]>()
    .exec();
}

async function markSending(id: string): Promise<DispatchableNotification | null> {
  return NotificationOutboxModel.findOneAndUpdate(
    {
      _id: id,
      status: { $in: ['pending', 'failed'] },
      scheduledAt: { $lte: new Date() },
    },
    {
      $inc: { attempts: 1 },
      $set: { status: 'sending', updatedAt: new Date() },
    },
    { new: true }
  ).lean<DispatchableNotification | null>().exec();
}

async function markSent(id: string, providerMessageId?: string): Promise<void> {
  await NotificationOutboxModel.updateOne(
    { _id: id },
    {
      $set: {
        status: 'sent',
        sentAt: new Date(),
        lastError: null,
      },
    }
  ).exec();
}

async function markFailed(id: string, attempts: number, errorMessage: string): Promise<void> {
  const deadLetter = attempts >= maxAttempts;
  const retryDelaySeconds = deadLetter ? null : getRetryDelaySeconds(attempts);
  await NotificationOutboxModel.updateOne(
    { _id: id },
    {
      $set: {
        status: deadLetter ? 'dead_letter' : 'failed',
        lastError: errorMessage,
        scheduledAt: deadLetter ? null : new Date(Date.now() + retryDelaySeconds! * 1000),
      },
    }
  ).exec();
}

async function dispatchBatch(): Promise<void> {
  const client = await getRedisClient();
  if (!client) {
    return;
  }

  if (dispatchInFlight) {
    return;
  }

  const locked = await acquireLock(client);
  if (!locked) {
    return;
  }

  dispatchInFlight = true;
  try {
    const pending = await loadPendingNotifications();
    for (const row of pending) {
      const lockedRow = await markSending(String(row._id));
      if (!lockedRow) {
        continue;
      }

      try {
        const adapter = getNotificationAdapter(lockedRow.channel);
        const result = await adapter.send({
          tenantId: lockedRow.tenantId,
          recipient: lockedRow.recipient,
          renderedMessage: lockedRow.renderedMessage,
          payload: lockedRow.payload ?? {},
          eventType: lockedRow.eventType,
        });
        await markSent(String(lockedRow._id), result.providerMessageId);
      } catch (error: any) {
        const attempts = Number(lockedRow.attempts ?? 0);
        await markFailed(String(lockedRow._id), attempts, error?.message ?? 'Notification dispatch failed');
      }
    }
    await renewLock(client);
  } finally {
    dispatchInFlight = false;
    await releaseLock(client).catch(() => undefined);
  }
}

export function startNotificationDispatcher(): void {
  if (dispatcherStarted || !env.redisUrl) {
    return;
  }

  dispatcherStarted = true;
  void dispatchBatch().catch((error) => {
    console.warn('Notification dispatcher initial run failed:', error);
  });
  dispatcherInterval = setInterval(() => {
    void dispatchBatch().catch((error) => {
      console.warn('Notification dispatcher run failed:', error);
    });
  }, dispatcherIntervalMs);
}

export function stopNotificationDispatcher(): void {
  if (dispatcherInterval) {
    clearInterval(dispatcherInterval);
    dispatcherInterval = null;
  }

  dispatcherStarted = false;
}

export async function runNotificationDispatcherOnce(): Promise<void> {
  await dispatchBatch();
}
