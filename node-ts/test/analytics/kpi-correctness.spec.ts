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

describe('analytics KPI correctness', () => {
  const startDate = new Date('2025-01-01T00:00:00.000Z');
  const endDate = new Date('2025-01-01T23:59:59.999Z');

  const createId = () => new mongoose.Types.ObjectId();

  it('reconciles KPI totals with seeded transactional records', async () => {
    const owner = await Auth.create({
      username: 'kpi-owner',
      firstName: 'Owner',
      lastName: 'Tester',
      email: `kpi-${Date.now()}-${Math.random()}@example.com`,
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
      name: 'KPI Tenant',
      slug: `kpi-tenant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      activeState: true,
      description: '',
    } as any);

    const branche = await Branche.create({
      ownerId: owner._id,
      tenantId: tenant._id,
      branche: 'KPI Branch',
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
      openedAt: new Date('2025-01-01T09:00:00.000Z'),
      closedAt: new Date('2025-01-01T12:00:00.000Z'),
      openingCash: 0,
      closingCash: 0,
      status: ShiftStatus.Closed,
      invoicesTotal: 300,
      sessionsStarted: 1,
      sessionsEnded: 1,
      workedMinutes: 180,
      activeState: false,
      description: '',
    } as any);

    const roomDevice = {
      deviceId: createId(),
      createdBy: owner._id,
      closedBy: owner._id,
      type: 'room',
      Sessiontype: 'open',
      price: 50,
      startTime: new Date('2025-01-01T09:00:00.000Z'),
      endTime: new Date('2025-01-01T11:00:00.000Z'),
      estimationTime: '',
      estimationInHours: 2,
      estimationInMinutes: 0,
    };

    const computerDevice = {
      deviceId: createId(),
      createdBy: owner._id,
      closedBy: owner._id,
      type: 'computer',
      Sessiontype: 'open',
      price: 140,
      startTime: new Date('2025-01-01T11:30:00.000Z'),
      endTime: new Date('2025-01-01T12:30:00.000Z'),
      estimationTime: '',
      estimationInHours: 1,
      estimationInMinutes: 0,
    };

    await Session.create({
      createdBy: owner._id,
      tenantId: tenant._id,
      brancheId: branche._id,
      clientId: null,
      shiftId: shift._id,
      activeState: false,
      createdAt: new Date('2025-01-01T09:00:00.000Z'),
      description: '',
      total: 300,
      devicesTotal: 240,
      menuItemsTotal: 60,
      devices: [roomDevice, computerDevice],
      menuItems: [
        {
          itemID: createId(),
          createdBy: owner._id,
          itemName: 'Cola',
          quantity: 3,
          price: 20,
        },
      ],
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
      createdAt: new Date('2025-01-01T12:30:00.000Z'),
      description: '',
      total: 300,
      devicesTotal: 240,
      menuItemsTotal: 60,
      invoiceNo: 1,
      devices: [roomDevice, computerDevice],
      menuItems: [
        {
          itemID: createId(),
          createdBy: owner._id,
          itemName: 'Cola',
          quantity: 3,
          price: 20,
        },
      ],
    } as any);

    const summary = await AnalyticsService.getTenantKpiSummary({
      tenantId: String(tenant._id),
      brancheId: String(branche._id),
      startDate,
      endDate,
      period: KpiPeriod.Day,
    });

    expect(summary.totals.revenue).toBe(300);
    expect(summary.totals.devicesRevenue).toBe(240);
    expect(summary.totals.menuItemsRevenue).toBe(60);
    expect(summary.totals.workedHours).toBe(3);
    expect(summary.totals.sessionsStarted).toBe(1);
    expect(summary.totals.sessionsEnded).toBe(2);
    expect(summary.revenueByDeviceType.map((bucket) => bucket.deviceType).sort()).toEqual(['computer', 'room']);
    expect(summary.revenueByDeviceType.map((bucket) => bucket.total).sort((a, b) => a - b)).toEqual([100, 140]);
    expect(summary.busiestHours.map((bucket) => bucket.hour).sort()).toEqual([11, 12]);
    expect(summary.revenueByShift).toHaveLength(1);
    expect(summary.revenueByShift[0].total).toBe(300);
    expect(summary.revenueByBranch[0].total).toBe(300);
  });
});
