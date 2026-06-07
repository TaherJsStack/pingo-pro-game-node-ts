import mongoose from 'mongoose';
import Auth from '../../src/models/auth';
import Branche from '../../src/models/branche';
import Category from '../../src/models/category';
import ComplaintsSuggestion from '../../src/models/complaints-suggestion';
import Invoice from '../../src/models/invoice';
import Session from '../../src/models/session';
import Tenant from '../../src/models/tenant';
import { runTenantBackfill } from '../../src/jobs/backfill-tenants';

describe('tenant backfill', () => {
  const createId = () => new mongoose.Types.ObjectId();

  async function seedTenant(label: string) {
    const owner = await Auth.create({
      username: `${label}-owner`,
      firstName: 'Owner',
      lastName: 'Tester',
      email: `${label}-${Date.now()}-${Math.random()}@example.com`,
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
      name: `${label} Tenant`,
      slug: `${label}-tenant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      activeState: true,
      description: '',
    } as any);

    const branche = await Branche.create({
      ownerId: owner._id,
      tenantId: tenant._id,
      branche: `${label} Branch`,
      logo: '',
      address: '',
      activeState: true,
      description: '',
    } as any);

    return { owner, tenant, branche };
  }

  it('dry-runs and applies tenantId backfill from brancheId without touching orphaned docs', async () => {
    const seeded = await seedTenant('backfill');
    await Category.create({
      ownerId: seeded.owner._id,
      createdBy: seeded.owner._id,
      brancheId: seeded.branche._id,
      category: 'Games',
      price: 50,
      type: 'room',
      logo: '',
      description: '',
      activeState: true,
      bookState: false,
    } as any);

    await ComplaintsSuggestion.create({
      brancheId: seeded.branche._id,
      createdBy: seeded.owner._id,
      name: 'Visitor',
      email: 'visitor@example.com',
      phone: '01000000001',
      comment: 'Great service',
      type: 'complaint',
      activeState: true,
      description: '',
    } as any);

    await Session.create({
      createdBy: seeded.owner._id,
      brancheId: seeded.branche._id,
      clientId: null,
      shiftId: null,
      activeState: true,
      description: '',
      total: 0,
      categoriesTotal: 0,
      menuItemsTotal: 0,
      categories: [],
      menuItems: [],
    } as any);

    await Invoice.create({
      createdBy: seeded.owner._id,
      closedBy: seeded.owner._id,
      brancheId: seeded.branche._id,
      sessionId: null,
      shiftId: null,
      clientId: null,
      name: '',
      phone: '',
      activeState: false,
      description: '',
      total: 0,
      categoriesTotal: 0,
      menuItemsTotal: 0,
      invoiceNo: 1,
      categories: [],
      menuItems: [],
    } as any);

    const dryRun = await runTenantBackfill(true);
    expect(dryRun.dryRun).toBe(true);
    expect(dryRun.orphanCount).toBe(0);
    expect(dryRun.updatedCount).toBeGreaterThan(0);

    const beforeApply = await Category.findOne({ category: 'Games' }).lean();
    expect(beforeApply?.tenantId ?? null).toBeNull();

    const applied = await runTenantBackfill(false);
    expect(applied.dryRun).toBe(false);
    expect(applied.orphanCount).toBe(0);

    const category = await Category.findOne({ category: 'Games' }).lean();
    const complaint = await ComplaintsSuggestion.findOne({ comment: 'Great service' }).lean();
    const session = await Session.findOne({ createdBy: seeded.owner._id }).lean();
    const invoice = await Invoice.findOne({ invoiceNo: 1 }).lean();

    expect(String(category?.tenantId)).toBe(String(seeded.tenant._id));
    expect(String(complaint?.tenantId)).toBe(String(seeded.tenant._id));
    expect(String(session?.tenantId)).toBe(String(seeded.tenant._id));
    expect(String(invoice?.tenantId)).toBe(String(seeded.tenant._id));
  });
});
