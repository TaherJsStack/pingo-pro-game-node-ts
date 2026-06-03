/**
 * Lifecycle status of a Subscription.
 * Values are the persisted strings. Do not change them without a data migration.
 *
 * pending_payment -> trialing | active
 * trialing -> active | expired | canceled
 * active -> past_due | canceled | expired
 * past_due -> active | expired | canceled
 */
export enum SubscriptionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Canceled = 'canceled',
  Trialing = 'trialing',
  PendingPayment = 'pending_payment',
  PastDue = 'past_due',
  Expired = 'expired',
}
