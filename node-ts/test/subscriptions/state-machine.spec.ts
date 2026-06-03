import { SubscriptionStatus } from '../../src/enums';
import {
  assertSubscriptionTransition,
  canTransitionSubscription,
} from '../../src/services/subscription.service';

describe('subscription state machine', () => {
  it('allows pending payment to become active', () => {
    expect(canTransitionSubscription(SubscriptionStatus.PendingPayment, SubscriptionStatus.Active)).toBe(true);
  });

  it('rejects expired subscription revival', () => {
    expect(canTransitionSubscription(SubscriptionStatus.Expired, SubscriptionStatus.Active)).toBe(false);
    expect(() => assertSubscriptionTransition(SubscriptionStatus.Expired, SubscriptionStatus.Active)).toThrow(
      'Illegal subscription status transition'
    );
  });
});
