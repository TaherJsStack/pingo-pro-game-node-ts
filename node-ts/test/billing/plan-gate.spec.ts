import mongoose from 'mongoose';
import { createPlanGate } from '../../src/middleware/plan-gate';
import Auth from '../../src/models/auth';
import Branche from '../../src/models/branche';
import Plan from '../../src/models/plan';
import Session from '../../src/models/session';
import Subscription from '../../src/models/subscription';
import Tenant from '../../src/models/tenant';
import { SubscriptionStatus } from '../../src/enums';

describe('billing plan gate', () => {
  const createId = () => new mongoose.Types.ObjectId();

  async function seedTenant(tier: 'basic' | 'advanced', tenantSuffix: string) {
    const owner = await Auth.create({
      username: `${tier}-${tenantSuffix}`,
      firstName: 'Plan',
      lastName: 'Owner',
      email: `${tier}-${tenantSuffix}-${Date.now()}-${Math.random()}@example.com`,
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
      name: `${tier} Tenant ${tenantSuffix}`,
      slug: `${tier}-tenant-${tenantSuffix}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      activeState: true,
      description: '',
    } as any);

    const branche = await Branche.create({
      ownerId: owner._id,
      tenantId: tenant._id,
      branche: `${tier}-branch-${tenantSuffix}`,
      logo: '',
      address: '',
      activeState: true,
      description: '',
    } as any);

    const plan = await Plan.create({
      tier,
      name: `${tier} plan`,
      price: 100,
      durationMonths: 1,
      currency: 'EGP',
      deviceLimit: tier === 'advanced' ? 8 : 3,
      featureFlags: tier === 'advanced' ? ['vip', 'package', 'priority-support'] : ['hourly', 'receipt-printing'],
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

    return { owner, tenant, branche, plan };
  }

  async function createActiveSession(owner: any, tenant: any, branche: any) {
    return Session.create({
      createdBy: owner._id,
      tenantId: tenant._id,
      brancheId: branche._id,
      activeState: true,
      description: '',
      categoriesTotal: 0,
      menuItemsTotal: 0,
      total: 0,
      categories: [
        {
          categoryId: createId(),
          createdBy: owner._id,
          closedBy: null,
          type: 'room',
          Sessiontype: 'open',
          price: 50,
          startTime: new Date('2025-01-01T10:00:00.000Z'),
          estimationInHours: 1,
          estimationInMinutes: 0,
        },
      ],
      menuItems: [],
    } as any);
  }

  function invokeGate(req: any, gate: ReturnType<typeof createPlanGate>) {
    const res: any = {
      statusCode: 200,
      payload: null,
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(payload: any) {
        this.payload = payload;
        return this;
      },
    };

    const next = jest.fn();
    return gate(req, res, next).then(() => ({ res, next }));
  }

  it('blocks unsupported advanced-only features on basic plans', async () => {
    const { owner, tenant, branche } = await seedTenant('basic', 'feature');
    const gate = createPlanGate({ requiredFeature: 'vip' });

    const { res, next } = await invokeGate(
      {
        authData: { id: String(owner._id), tenantId: String(tenant._id) },
        body: { brancheId: String(branche._id), categories: [{ categoryId: createId() }] },
      },
      gate
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.payload.errors[0]).toContain('vip');
  });

  it('blocks a branch when device usage exceeds the plan limit', async () => {
    const { owner, tenant, branche } = await seedTenant('basic', 'limit');
    await Promise.all([
      createActiveSession(owner, tenant, branche),
      createActiveSession(owner, tenant, branche),
      createActiveSession(owner, tenant, branche),
    ]);

    const gate = createPlanGate();
    const { res, next } = await invokeGate(
      {
        authData: { id: String(owner._id), tenantId: String(tenant._id) },
        body: { brancheId: String(branche._id), categories: [{ categoryId: createId() }] },
      },
      gate
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.payload.errors[0]).toContain('allows 3 devices');
  });

  it('keeps tenant usage isolated when another tenant is already at limit', async () => {
    const tenantA = await seedTenant('basic', 'a');
    const tenantB = await seedTenant('basic', 'b');

    await Promise.all([
      createActiveSession(tenantA.owner, tenantA.tenant, tenantA.branche),
      createActiveSession(tenantA.owner, tenantA.tenant, tenantA.branche),
      createActiveSession(tenantA.owner, tenantA.tenant, tenantA.branche),
    ]);

    const gate = createPlanGate();
    const { res, next } = await invokeGate(
      {
        authData: { id: String(tenantB.owner._id), tenantId: String(tenantB.tenant._id) },
        body: { brancheId: String(tenantB.branche._id), categories: [{ categoryId: createId() }] },
      },
      gate
    );

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
