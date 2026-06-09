import { planRepository } from '../../repositories/instances';
import { IPlan } from '../../models/interfaces/plan.interface';

type PlanSeedSpec = Pick<IPlan, 'code' | 'tier' | 'name' | 'price' | 'durationMonths' | 'currency' | 'description'>;

// Default global plan catalog. `code` is the stable idempotency key — the validate
// hook on the Plan model derives amountMinor/billingIntervalMonths/deviceLimit/featureFlags.
const PLAN_SEEDS: PlanSeedSpec[] = [
  {
    code: 'free',
    tier: 'basic',
    name: 'Free',
    price: 0,
    durationMonths: 1,
    currency: 'EGP',
    description: 'Free plan with basic features.',
  },
  {
    code: 'quarterly',
    tier: 'basic',
    name: '3 Months',
    price: 300,
    durationMonths: 3,
    currency: 'EGP',
    description: 'Quarterly plan billed every 3 months.',
  },
  {
    code: 'extended',
    tier: 'advanced',
    name: '60 Months',
    price: 5000,
    durationMonths: 60,
    currency: 'EGP',
    description: 'Extended 60-month plan with advanced features.',
  },
];

/**
 * Idempotently inserts the default plan catalog. Existing plans (matched by `code`)
 * are left untouched, so this is safe to run on every startup. A seeding failure is
 * logged but never blocks server start.
 */
export async function seedPlans(): Promise<void> {
  try {
    let created = 0;
    let skipped = 0;

    for (const spec of PLAN_SEEDS) {
      const existing = await planRepository.findOne({ code: spec.code });
      if (existing) {
        skipped += 1;
        continue;
      }
      await planRepository.create(spec as Partial<IPlan>);
      created += 1;
    }

    console.log(`[seedPlans] plans seeded — created ${created}, skipped ${skipped}`);
  } catch (err) {
    console.warn('[seedPlans] failed to seed plans:', (err as Error).message);
  }
}
