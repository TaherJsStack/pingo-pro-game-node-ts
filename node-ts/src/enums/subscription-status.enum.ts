/**
 * Lifecycle status of a Subscription.
 * Values are the persisted strings — do not change them without a data migration.
 */
export enum SubscriptionStatus {
  Active = 'active',
  Inactive = 'inactive',
  Canceled = 'canceled',
}
