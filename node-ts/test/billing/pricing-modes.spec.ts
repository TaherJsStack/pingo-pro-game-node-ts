import mongoose from 'mongoose';
import Auth from '../../src/models/auth';
import Branche from '../../src/models/branche';
import Plan from '../../src/models/plan';
import Pricing from '../../src/models/pricing';
import Session from '../../src/models/session';
import Subscription from '../../src/models/subscription';
import Tenant from '../../src/models/tenant';
import { SubscriptionStatus } from '../../src/enums';
import { SessionService } from '../../src/services/session.service';

describe('billing pricing modes', () => {
  const sessionService = new SessionService();
  const createId = () => new mongoose.Types.ObjectId();

  async function seedScope(planName: string) {
    const owner = await Auth.create({
      username: `${planName}-owner`,
      firstName: 'Owner',
      lastName: 'Tester',
      email: `${planName}-${Date.now()}-${Math.random()}@example.com`,
      phone: '01000000000',
      image: '',
      activeState: true,
      role: 2,
      permission: [2],
      authType: 'owner',
      permissions: [],
    } as any);

    const tenant = await Tenant.create({
      ownerId: owner._id,
      name: `${planName} Tenant`,
      slug: `${planName}-tenant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      activeState: true,
      description: '',
    } as any);

    const branche = await Branche.create({
      ownerId: owner._id,
      tenantId: tenant._id,
      branche: `${planName}-Branch-${Date.now()}-${Math.random()}`,
      logo: '',
      address: '',
      activeState: true,
      description: '',
    } as any);

    const plan = await Plan.create({
      tier: 'basic',
      name: `${planName} Plan`,
      price: 100,
      durationMonths: 1,
      currency: 'EGP',
      deviceLimit: 3,
      featureFlags: ['hourly', 'receipt-printing'],
      activeState: true,
      description: '',
    } as any);

    await Subscription.create({
      userId: owner._id,
      tenantId: tenant._id,
      plan: plan._id,
      status: SubscriptionStatus.Active,
      startDate: new Date('2025-01-01T00:00:00.000Z'),
      endDate: new Date('2025-02-01T00:00:00.000Z'),
      trial: false,
      currency: 'EGP',
      autoRenew: true,
      cancelAtPeriodEnd: false,
      failedAttempts: 0,
      activeState: true,
      description: '',
    } as any);

    return { owner, tenant, branche };
  }

  async function assertPricingMode(mode: 'hourly' | 'package' | 'vip', expectedTotal: number) {
    const { owner, tenant, branche } = await seedScope(mode);

    await Pricing.create({
      ownerId: owner._id,
      tenantId: tenant._id,
      brancheId: branche._id,
      createdBy: owner._id,
      title: `${mode} room rate`,
      price: 50,
      type: mode,
      deviceType: 'room',
      activeState: true,
      description: '',
    } as any);

    const startedAt = new Date('2025-01-01T10:00:00.000Z');
    const session = await sessionService.createItem(
      {
        brancheId: branche._id,
        clientId: null,
        categories: [
          {
            categoryId: createId(),
            type: 'room',
            Sessiontype: 'open',
            price: 0,
            startTime: startedAt,
            estimationInHours: 2,
            estimationInMinutes: 0,
          },
        ],
        menuItems: [],
      } as any,
      String(owner._id),
      String(tenant._id)
    );

    const result = await sessionService.endSession(
      String(session._id),
      {
        categoriesIds: [String(session.categories[0].categoryId)],
        endTime: '2025-01-01T12:00:00.000Z',
      },
      String(owner._id),
      String(tenant._id)
    );

    expect(result.bill).toBeTruthy();
    expect(result.bill.categories[0].pricingMode).toBe(mode);
    expect(result.bill.categoriesTotal).toBe(expectedTotal);
  }

  it('computes hourly charges from the resolved pricing policy', async () => {
    await assertPricingMode('hourly', 100);
  });

  it('computes package charges from the resolved pricing policy', async () => {
    await assertPricingMode('package', 100);
  });

  it('computes vip charges from the resolved pricing policy', async () => {
    await assertPricingMode('vip', 100);
  });
});
