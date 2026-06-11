import cron, { ScheduledTask } from 'node-cron';
import { env } from '../config/env';
import { InboxType } from '../enums/inbox-type.enum';
import { RealtimeEvent } from '../enums/realtime-event.enum';
import InboxModel from '../models/inbox';
import SubscriptionModel from '../models/subscription';
import BillingService from '../services/billing.service';
import { getIo, getUserRoom } from '../../socket';

let schedulerStarted = false;
let scheduledTasks: ScheduledTask[] = [];

export function startBillingScheduler(): void {
  if (schedulerStarted || !env.billingCronEnabled) {
    return;
  }

  scheduledTasks = [
    cron.schedule('0 2 * * *', () => {
    void BillingService.processDueRenewals(new Date()).catch((error) => {
      console.error('Billing due-renewal job failed:', error?.message ?? error);
    });
    }),

    cron.schedule('*/15 * * * *', () => {
    void BillingService.reconcilePendingPayments(new Date()).catch((error) => {
      console.error('Billing reconcile job failed:', error?.message ?? error);
    });
    }),

    cron.schedule('0 10 * * *', () => {
    void sendExpiryWarnings().catch((error) => {
      console.error('Billing expiry-warning job failed:', error?.message ?? error);
    });
    }),
  ];

  schedulerStarted = true;
}

export function stopBillingScheduler(): void {
  scheduledTasks.forEach((task) => task.stop());
  scheduledTasks = [];
  schedulerStarted = false;
}

async function sendExpiryWarnings(): Promise<void> {
  if (!env.billingCronEnabled) {
    return;
  }

  const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const subscriptions = await SubscriptionModel.find({
    status: 'active',
    expiryNotificationSent: false,
    autoRenew: false,
    endDate: { $lte: twoDaysFromNow },
  }).populate('plan', 'name');

  for (const subscription of subscriptions) {
    const planName = (subscription.plan as any)?.name ?? 'الباقة';
    const message = await InboxModel.create({
      ownerId: subscription.userId,
      tenantId: subscription.tenantId ?? null,
      title: 'اشتراكك ينتهي قريباً',
      context: `باقتك "${planName}" ستنتهي خلال يومين. يرجى تجديد الاشتراك للحفاظ على الخدمة.`,
      type: InboxType.Notification,
      isSeen: false,
      activeState: true,
    });

    try {
      getIo().to(getUserRoom(String(subscription.userId))).emit(RealtimeEvent.InboxMessage, message);
    } catch {
      // Socket delivery is best effort; the inbox row is the durable notification.
    }

    await SubscriptionModel.updateOne({ _id: subscription._id }, { expiryNotificationSent: true });
  }
}
