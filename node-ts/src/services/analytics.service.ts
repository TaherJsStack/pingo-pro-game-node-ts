import { createClient } from 'redis';
import { Types } from 'mongoose';
import AnalyticsEventModel from '../models/analytics-event';
import InvoiceModel from '../models/invoice';
import SessionModel from '../models/session';
import ShiftModel from '../models/shift';
import { KpiPeriod } from '../enums/kpi-period.enum';
import { ShiftStatus } from '../enums/shift-status.enum';
import { env } from '../config/env';
import { roundMoney } from '../util/money';

export interface AnalyticsKpiRequest {
  tenantId?: string;
  brancheId?: string;
  startDate: Date;
  endDate: Date;
  period: KpiPeriod;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface AggregationBucket {
  period: string;
  total: number;
  count: number;
}

interface RevenueByShiftBucket {
  shiftId: string | null;
  branchId: string | null;
  employeeId: string | null;
  shiftStatus: string | null;
  openedAt: Date | null;
  closedAt: Date | null;
  total: number;
  categoriesTotal: number;
  menuItemsTotal: number;
  invoicesCount: number;
}

interface RevenueByDeviceBucket {
  deviceType: string;
  total: number;
  categoriesCount: number;
  invoicesCount: number;
}

interface RevenueByBranchBucket {
  brancheId: string | null;
  branchName: string | null;
  total: number;
  invoicesCount: number;
}

interface BusiestHourBucket {
  hour: number;
  total: number;
  revenue: number;
}

export interface AnalyticsKpiSummary {
  period: KpiPeriod;
  startDate: Date;
  endDate: Date;
  totals: {
    revenue: number;
    categoriesRevenue: number;
    menuItemsRevenue: number;
    workedHours: number;
    workedMinutes: number;
    sessionsStarted: number;
    sessionsEnded: number;
    shiftsCount: number;
    invoicesCount: number;
  };
  revenueByPeriod: AggregationBucket[];
  workedHoursByPeriod: AggregationBucket[];
  sessionsStartedByPeriod: AggregationBucket[];
  sessionsEndedByPeriod: AggregationBucket[];
  workedHoursByEmployee: Array<{
    employeeId: string;
    firstName?: string;
    lastName?: string;
    workedHours: number;
    workedMinutes: number;
    invoicesTotal: number;
    sessionsStarted: number;
    sessionsEnded: number;
    shiftsCount: number;
  }>;
  revenueByShift: RevenueByShiftBucket[];
  revenueByDeviceType: RevenueByDeviceBucket[];
  revenueByBranch: RevenueByBranchBucket[];
  busiestHours: BusiestHourBucket[];
}

export interface AnalyticsEventPayload {
  tenantId: string;
  brancheId: string;
  shiftId?: string | null;
  sessionId?: string | null;
  invoiceId?: string | null;
  deviceType: string;
  eventType: string;
  amount: number;
  occurredAt?: Date;
  metadata?: Record<string, unknown>;
}

class AnalyticsService {
  private readonly cachePrefix = 'analytics:kpi';
  private readonly ttlSeconds = 300;
  private redisClient: any = null;
  private redisInitPromise: Promise<any> | null = null;
  private readonly memoryCache = new Map<string, CacheEntry<unknown>>();

  private async getRedisClient(): Promise<any | null> {
    if (!env.redisUrl) {
      return null;
    }

    if (this.redisClient?.isOpen) {
      return this.redisClient;
    }

    if (this.redisInitPromise) {
      return this.redisInitPromise;
    }

    this.redisInitPromise = (async () => {
      const client: any = createClient({ url: env.redisUrl });
      client.on('error', (error: any) => {
        console.warn('Analytics Redis client error:', error);
      });

      try {
        await client.connect();
        this.redisClient = client;
        return client;
      } catch (error) {
        console.warn('Analytics Redis cache unavailable:', error);
        this.redisClient = null;
        return null;
      }
    })().finally(() => {
      this.redisInitPromise = null;
    });

    return this.redisInitPromise;
  }

  private buildCacheKey(request: AnalyticsKpiRequest): string {
    const branchScope = request.brancheId ?? 'all';
    return [
      this.cachePrefix,
      request.tenantId ?? 'platform',
      branchScope,
      request.period,
      request.startDate.toISOString(),
      request.endDate.toISOString(),
    ].join(':');
  }

  private async readCache<T>(key: string): Promise<T | null> {
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }
    if (cached) {
      this.memoryCache.delete(key);
    }

    const client = await this.getRedisClient();
    if (!client) {
      return null;
    }

    const raw = await client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  private async writeCache<T>(key: string, value: T): Promise<void> {
    this.memoryCache.set(key, { value, expiresAt: Date.now() + this.ttlSeconds * 1000 });

    const client = await this.getRedisClient();
    if (!client) {
      return;
    }

    await client.set(key, JSON.stringify(value), { EX: this.ttlSeconds });
  }

  private async invalidateTenantCache(tenantId: string): Promise<void> {
    const prefix = `${this.cachePrefix}:${tenantId}:`;
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }

    const client = await this.getRedisClient();
    if (!client) {
      return;
    }

    for await (const key of client.scanIterator({ MATCH: `${prefix}*`, COUNT: 100 })) {
      await client.del(String(key));
    }
  }

  async recordEvent(payload: AnalyticsEventPayload): Promise<void> {
    try {
      await AnalyticsEventModel.create({
        tenantId: new Types.ObjectId(payload.tenantId),
        brancheId: new Types.ObjectId(payload.brancheId),
        shiftId: payload.shiftId ? new Types.ObjectId(payload.shiftId) : null,
        sessionId: payload.sessionId ? new Types.ObjectId(payload.sessionId) : null,
        invoiceId: payload.invoiceId ? new Types.ObjectId(payload.invoiceId) : null,
        deviceType: payload.deviceType,
        eventType: payload.eventType,
        amount: roundMoney(payload.amount),
        occurredAt: payload.occurredAt ?? new Date(),
        metadata: payload.metadata ?? {},
        activeState: true,
        description: payload.eventType,
      } as any);
    } catch (error) {
      console.warn('Analytics event persistence failed:', error);
    }

    await this.invalidateTenantCache(payload.tenantId);
  }

  async getTenantKpiSummary(request: AnalyticsKpiRequest): Promise<AnalyticsKpiSummary> {
    const cacheKey = this.buildCacheKey(request);
    const cached = await this.readCache<AnalyticsKpiSummary>(cacheKey);
    if (cached) {
      return cached;
    }

    const summary = await this.buildKpiSummary(request);
    await this.writeCache(cacheKey, summary);
    return summary;
  }

  private toMatchFilter(request: AnalyticsKpiRequest) {
    const match: Record<string, unknown> = {
      activeState: false,
      createdAt: { $gte: request.startDate, $lte: request.endDate },
    };

    if (request.tenantId) {
      match.tenantId = new Types.ObjectId(request.tenantId);
    }

    if (request.brancheId) {
      match.brancheId = new Types.ObjectId(request.brancheId);
    }

    return match;
  }

  private durationExpression(startPath: string, endPath: string) {
    return {
      $divide: [
        { $subtract: [endPath, startPath] },
        1000 * 60 * 60,
      ],
    };
  }

  private async buildKpiSummary(request: AnalyticsKpiRequest): Promise<AnalyticsKpiSummary> {
    const match = this.toMatchFilter(request);
    const period = request.period;

    const invoiceMatch = {
      ...match,
      activeState: false,
    };
    const shiftMatch: Record<string, any> = {
      status: ShiftStatus.Closed,
      openedAt: { $gte: request.startDate, $lte: request.endDate },
    };

    if (request.tenantId) {
      shiftMatch.tenantId = new Types.ObjectId(request.tenantId);
    }

    if (request.brancheId) {
      shiftMatch.brancheId = new Types.ObjectId(request.brancheId);
    }

    const [revenueByPeriod, revenueByShift, revenueByDeviceType, revenueByBranch, busiestHours, sessionsStartedByPeriod, sessionsEndedByPeriod, workedHoursByPeriod, workedHoursByEmployee] = await Promise.all([
      InvoiceModel.aggregate([
        { $match: invoiceMatch },
        {
          $group: {
            _id: { $dateTrunc: { date: '$createdAt', unit: period } },
            total: { $sum: '$total' },
            categoriesTotal: { $sum: '$categoriesTotal' },
            menuItemsTotal: { $sum: '$menuItemsTotal' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            period: '$_id',
            total: { $round: ['$total', 2] },
            categoriesTotal: { $round: ['$categoriesTotal', 2] },
            menuItemsTotal: { $round: ['$menuItemsTotal', 2] },
            count: 1,
          },
        },
      ]),
      InvoiceModel.aggregate([
        { $match: invoiceMatch },
        {
          $group: {
            _id: '$shiftId',
            total: { $sum: '$total' },
            categoriesTotal: { $sum: '$categoriesTotal' },
            menuItemsTotal: { $sum: '$menuItemsTotal' },
            invoicesCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'shifts',
            localField: '_id',
            foreignField: '_id',
            as: 'shift',
          },
        },
        {
          $unwind: {
            path: '$shift',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            shiftId: { $ifNull: ['$_id', null] },
            branchId: { $ifNull: ['$shift.brancheId', null] },
            employeeId: { $ifNull: ['$shift.employeeId', null] },
            shiftStatus: { $ifNull: ['$shift.status', null] },
            openedAt: { $ifNull: ['$shift.openedAt', null] },
            closedAt: { $ifNull: ['$shift.closedAt', null] },
            total: { $round: ['$total', 2] },
            categoriesTotal: { $round: ['$categoriesTotal', 2] },
            menuItemsTotal: { $round: ['$menuItemsTotal', 2] },
            invoicesCount: 1,
          },
        },
      ]),
      InvoiceModel.aggregate([
        { $match: invoiceMatch },
        { $unwind: '$categories' },
        {
          $match: {
            'categories.endTime': { $ne: null },
          },
        },
        {
          $addFields: {
            categoryHours: this.durationExpression('$categories.startTime', '$categories.endTime'),
            categoryRevenue: {
              $multiply: [
                this.durationExpression('$categories.startTime', '$categories.endTime'),
                '$categories.price',
              ],
            },
          },
        },
        {
          $group: {
            _id: { $ifNull: ['$categories.type', 'unknown'] },
            total: { $sum: '$categoryRevenue' },
            categoriesCount: { $sum: 1 },
            invoicesCount: { $addToSet: '$_id' },
          },
        },
        {
          $project: {
            _id: 0,
            deviceType: '$_id',
            total: { $round: ['$total', 2] },
            categoriesCount: 1,
            invoicesCount: { $size: '$invoicesCount' },
          },
        },
        { $sort: { total: -1 } },
      ]),
      InvoiceModel.aggregate([
        { $match: invoiceMatch },
        {
          $group: {
            _id: '$brancheId',
            total: { $sum: '$total' },
            invoicesCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'branches',
            localField: '_id',
            foreignField: '_id',
            as: 'branch',
          },
        },
        {
          $unwind: {
            path: '$branch',
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            brancheId: { $ifNull: ['$_id', null] },
            branchName: { $ifNull: ['$branch.branche', null] },
            total: { $round: ['$total', 2] },
            invoicesCount: 1,
          },
        },
        { $sort: { total: -1 } },
      ]),
      InvoiceModel.aggregate([
        { $match: invoiceMatch },
        { $unwind: '$categories' },
        {
          $match: {
            'categories.endTime': { $ne: null },
          },
        },
        {
          $addFields: {
            categoryHours: this.durationExpression('$categories.startTime', '$categories.endTime'),
            categoryRevenue: {
              $multiply: [
                this.durationExpression('$categories.startTime', '$categories.endTime'),
                '$categories.price',
              ],
            },
          },
        },
        {
          $group: {
            _id: {
              $hour: {
                date: '$categories.endTime',
              },
            },
            total: { $sum: 1 },
            revenue: { $sum: '$categoryRevenue' },
          },
        },
        {
          $project: {
            _id: 0,
            hour: '$_id',
            total: 1,
            revenue: { $round: ['$revenue', 2] },
          },
        },
        { $sort: { hour: 1 } },
      ]),
      SessionModel.aggregate([
        { $match: { ...match, createdAt: { $gte: request.startDate, $lte: request.endDate } } },
        { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: period } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: '$_id', count: 1 } },
      ]),
      SessionModel.aggregate([
        { $match: { ...match, activeState: false } },
        { $unwind: '$categories' },
        {
          $match: {
            'categories.endTime': { $gte: request.startDate, $lte: request.endDate },
          },
        },
        { $group: { _id: { $dateTrunc: { date: '$categories.endTime', unit: period } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: '$_id', count: 1 } },
      ]),
      ShiftModel.aggregate([
        { $match: shiftMatch },
        { $group: { _id: { $dateTrunc: { date: '$openedAt', unit: period } }, workedMinutes: { $sum: '$workedMinutes' } } },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            period: '$_id',
            total: { $round: [{ $divide: ['$workedMinutes', 60] }, 2] },
            count: '$workedMinutes',
          },
        },
      ]),
      ShiftModel.aggregate([
        { $match: shiftMatch },
        {
          $group: {
            _id: '$employeeId',
            workedMinutes: { $sum: '$workedMinutes' },
            invoicesTotal: { $sum: '$invoicesTotal' },
            sessionsStarted: { $sum: '$sessionsStarted' },
            sessionsEnded: { $sum: '$sessionsEnded' },
            shiftsCount: { $sum: 1 },
          },
        },
        { $lookup: { from: 'auths', localField: '_id', foreignField: '_id', as: 'employee' } },
        { $unwind: { path: '$employee', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            employeeId: { $toString: '$_id' },
            workedMinutes: 1,
            workedHours: { $round: [{ $divide: ['$workedMinutes', 60] }, 2] },
            invoicesTotal: { $round: ['$invoicesTotal', 2] },
            sessionsStarted: 1,
            sessionsEnded: 1,
            shiftsCount: 1,
            firstName: '$employee.firstName',
            lastName: '$employee.lastName',
          },
        },
        { $sort: { workedMinutes: -1 } },
      ]),
    ]);

    const totals = {
      revenue: roundMoney(revenueByPeriod.reduce((sum, bucket) => sum + Number(bucket.total ?? 0), 0)),
      categoriesRevenue: roundMoney(revenueByPeriod.reduce((sum, bucket) => sum + Number((bucket as any).categoriesTotal ?? 0), 0)),
      menuItemsRevenue: roundMoney(revenueByPeriod.reduce((sum, bucket) => sum + Number((bucket as any).menuItemsTotal ?? 0), 0)),
      workedHours: roundMoney(workedHoursByPeriod.reduce((sum, bucket) => sum + Number(bucket.total ?? 0), 0)),
      workedMinutes: workedHoursByEmployee.reduce((sum, employee) => sum + Number(employee.workedMinutes ?? 0), 0),
      sessionsStarted: sessionsStartedByPeriod.reduce((sum, bucket) => sum + Number(bucket.count ?? 0), 0),
      sessionsEnded: sessionsEndedByPeriod.reduce((sum, bucket) => sum + Number(bucket.count ?? 0), 0),
      shiftsCount: revenueByShift.length,
      invoicesCount: revenueByPeriod.reduce((sum, bucket) => sum + Number(bucket.count ?? 0), 0),
    };

    return {
      period,
      startDate: request.startDate,
      endDate: request.endDate,
      totals,
      revenueByPeriod: revenueByPeriod as AggregationBucket[],
      workedHoursByPeriod: workedHoursByPeriod as AggregationBucket[],
      sessionsStartedByPeriod: sessionsStartedByPeriod as AggregationBucket[],
      sessionsEndedByPeriod: sessionsEndedByPeriod as AggregationBucket[],
      workedHoursByEmployee: workedHoursByEmployee as AnalyticsKpiSummary['workedHoursByEmployee'],
      revenueByShift: revenueByShift as RevenueByShiftBucket[],
      revenueByDeviceType: revenueByDeviceType as RevenueByDeviceBucket[],
      revenueByBranch: revenueByBranch as RevenueByBranchBucket[],
      busiestHours: busiestHours as BusiestHourBucket[],
    };
  }
}

export default new AnalyticsService();
