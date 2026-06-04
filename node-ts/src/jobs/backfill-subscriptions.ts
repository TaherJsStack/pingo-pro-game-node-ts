/**
 * One-off, idempotent backfill for subscriptions created before the expanded payment model.
 *
 * Run with: npx ts-node src/jobs/backfill-subscriptions.ts
 *
 * It:
 *  - sets a default `currency` (EGP) where missing,
 *  - fills `currentPeriodEnd` / `nextBillingDate` from `endDate` where missing,
 *  - normalizes any legacy `status` strings to the current enum,
 *  - reports (does NOT auto-delete) users with more than one Active/Trialing/PastDue
 *    subscription, which would violate the partial unique index, so they can be resolved
 *    by hand before the index is relied upon.
 *
 * Safe to run multiple times.
 */
import database from '../DB/mongoDBConfig';
import Subscription from '../models/subscription';
import { SubscriptionStatus } from '../enums';

const LEGACY_STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: SubscriptionStatus.Active,
  inactive: SubscriptionStatus.Inactive,
  canceled: SubscriptionStatus.Canceled,
  cancelled: SubscriptionStatus.Canceled,
  trial: SubscriptionStatus.Trialing,
  trialing: SubscriptionStatus.Trialing,
  expired: SubscriptionStatus.Expired,
  past_due: SubscriptionStatus.PastDue,
  pending: SubscriptionStatus.PendingPayment,
  pending_payment: SubscriptionStatus.PendingPayment,
};

const UNIQUE_STATUSES = [SubscriptionStatus.Active, SubscriptionStatus.Trialing, SubscriptionStatus.PastDue];

async function run(): Promise<void> {
  await database.connect();
  try {
    const subscriptions = await Subscription.find({}).lean();
    let updated = 0;

    for (const sub of subscriptions as any[]) {
      const set: Record<string, any> = {};

      if (!sub.currency) {
        set.currency = 'EGP';
      }
      if (!sub.currentPeriodEnd && sub.endDate) {
        set.currentPeriodEnd = sub.endDate;
      }
      if (!sub.nextBillingDate && sub.endDate) {
        set.nextBillingDate = sub.endDate;
      }
      const mapped = LEGACY_STATUS_MAP[String(sub.status ?? '').toLowerCase()];
      if (mapped && mapped !== sub.status) {
        set.status = mapped;
      }
      if (typeof sub.failedAttempts !== 'number') {
        set.failedAttempts = 0;
      }

      if (Object.keys(set).length > 0) {
        await Subscription.updateOne({ _id: sub._id }, { $set: set });
        updated += 1;
      }
    }

    // Report potential unique-index conflicts (do not auto-resolve).
    const conflicts = await Subscription.aggregate([
      { $match: { status: { $in: UNIQUE_STATUSES } } },
      { $group: { _id: '$userId', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    console.log(`Backfill complete. Documents updated: ${updated}.`);
    if (conflicts.length > 0) {
      console.warn(`WARNING: ${conflicts.length} user(s) have multiple active/trialing/past-due subscriptions:`);
      conflicts.forEach((c: any) => console.warn(`  userId=${c._id} count=${c.count} ids=${c.ids.join(',')}`));
      console.warn('Resolve these manually before enforcing the partial unique index.');
    } else {
      console.log('No unique-index conflicts found.');
    }
  } finally {
    await database.close();
  }
}

run().catch((error) => {
  console.error('Backfill failed:', error);
  process.exitCode = 1;
});
