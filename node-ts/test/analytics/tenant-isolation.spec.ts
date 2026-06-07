import mongoose from 'mongoose';
import AnalyticsService from '../../src/services/analytics.service';
import Auth from '../../src/models/auth';
import Branche from '../../src/models/branche';
import Invoice from '../../src/models/invoice';
import Session from '../../src/models/session';
import Shift from '../../src/models/shift';
import Tenant from '../../src/models/tenant';
import { ShiftStatus } from '../../src/enums/shift-status.enum';
import { KpiPeriod } from '../../src/enums/kpi-period.enum';

describe('analytics tenant isolation', () => {
  const startDate = new Date('2025-01-01T00:00:00.000Z');
  const endDate = new Date('2025-01-31T23:59:59.999Z');

  const createId = () => new mongoose.Types.ObjectId();

  async function seedTenant(label: string, revenue: number) {
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

    const shift = await Shift.create({
      employeeId: owner._id,
      tenantId: tenant._id,
      brancheId: branche._id,
      openedBy: owner._id,
      openedAt: new Date('2025-01-01T08:00:00.000Z'),
      closedAt: new Date('2025-01-01T12:00:00.000Z'),
      openingCash: 0,
      closingCash: 0,
      status: ShiftStatus.Closed,
      invoicesTotal: revenue,
      sessionsStarted: 1,
      sessionsEnded: 1,
      workedMinutes: 240,
      activeState: false,
      description: '',
    } as any);

    const baseCategory = {
      categoryId: createId(),
      createdBy: owner._id,
      closedBy: owner._id,
      type: 'room',
      Sessiontype: 'open',
      pricingId: null,
      pricingMode: 'hourly',
      price: revenue / 2,
      startTime: new Date('2025-01-01T08:00:00.000Z'),
      endTime: new Date('2025-01-01T10:00:00.000Z'),
      estimationTime: '',
      estimationInHours: 2,
      estimationInMinutes: 0,
    };

    await Session.create({
      createdBy: owner._id,
      tenantId: tenant._id,
      brancheId: branche._id,
      clientId: null,
      shiftId: shift._id,
      activeState: false,
      createdAt: new Date('2025-01-01T08:00:00.000Z'),
      description: '',
      total: revenue,
      categoriesTotal: revenue,
      menuItemsTotal: 0,
      categories: [baseCategory],
      menuItems: [],
    } as any);

    await Invoice.create({
      createdBy: owner._id,
      tenantId: tenant._id,
      closedBy: owner._id,
      brancheId: branche._id,
      sessionId: null,
      shiftId: shift._id,
      clientId: null,
      name: '',
      phone: '',
      activeState: false,
      createdAt: new Date('2025-01-01T10:00:00.000Z'),
      description: '',
      total: revenue,
      categoriesTotal: revenue,
      menuItemsTotal: 0,
      invoiceNo: revenue,
      categories: [baseCategory],
      menuItems: [],
    } as any);

    return { owner, tenant, branche };
  }

  it('keeps tenant KPI summaries isolated', async () => {
    const tenantA = await seedTenant('tenant-a', 120);
    await seedTenant('tenant-b', 999);

    const summary = await AnalyticsService.getTenantKpiSummary({
      tenantId: String(tenantA.tenant._id),
      brancheId: String(tenantA.branche._id),
      startDate,
      endDate,
      period: KpiPeriod.Day,
    });

    expect(summary.totals.revenue).toBe(120);
    expect(summary.totals.invoicesCount).toBe(1);
    expect(summary.revenueByBranch).toHaveLength(1);
    expect(summary.revenueByBranch[0].total).toBe(120);
    expect(summary.revenueByDeviceType).toHaveLength(1);
    expect(summary.revenueByDeviceType[0].total).toBe(120);
  });
});
