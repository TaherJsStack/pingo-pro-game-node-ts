/**
 * Category of an Inbox message.
 * NOTE: `Welcome` persists as the legacy misspelling `welcom` — keep the value as-is.
 */
export enum InboxType {
  Welcome = 'welcom',
  Notification = 'notification',
  Support = 'support',
  System = 'system',
}
