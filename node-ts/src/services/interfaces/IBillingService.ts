export interface IBillingService {
  processDueRenewals(now?: Date): Promise<void>;
  reconcilePendingPayments(now?: Date): Promise<void>;
  expireEndedSubscriptions(now?: Date): Promise<void>;
}
