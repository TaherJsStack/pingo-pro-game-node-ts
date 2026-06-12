import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { SendResponse } from '../base/sendResponse';
import AnalyticsService from '../../services/analytics.service';
import { KpiPeriod } from '../../enums/kpi-period.enum';

export class StatisticsController extends SendResponse {
  constructor() {
    super();
    this.getCollectionStatistics = this.getCollectionStatistics.bind(this);
    this.getPlatformKpiSummary = this.getPlatformKpiSummary.bind(this);
  }
  async getCollectionStatistics(req: Request, res: Response) {
    // console.log('getCollectionStatistics');
    try {
      const collections = await mongoose.connection.db.listCollections().toArray();
      const statsPromises = collections.map(async (collection: any) => {
        const collectionName = collection.name;
        const count = await mongoose.connection.db.collection(collectionName).countDocuments();
        return { collectionName, count };
      });

      const stats = await Promise.all(statsPromises);
      const statsObject = stats.reduce<Record<string, number>>((acc, stat) => {
        acc[stat.collectionName] = stat.count;
        return acc;
      }, {});

      // res.json([statsObject]);
      this.sendResponse(req, res, 200, [statsObject]);
    } catch (error) {
      console.error(error);
      this.sendErrorResponse(req, res, error);
      // res.status(500).json({ error: 'An error occurred while fetching collection statistics' });
    }
  }
  async getPlatformKpiSummary(req: Request, res: Response) {
    try {
      const filterObg = typeof req.query.Filter === 'string'
        ? JSON.parse(req.query.Filter)
        : ((req.query.Filter as any) || {});

      const innerFilter = filterObg.filter || filterObg;
      const brancheId = filterObg.brancheId || innerFilter.brancheId;
      const startDate = innerFilter.startDate ? new Date(innerFilter.startDate) : new Date(0);
      const endDate = innerFilter.endDate ? new Date(innerFilter.endDate) : new Date();
      const allowedPeriods: KpiPeriod[] = Object.values(KpiPeriod);
      const requested = innerFilter.period || filterObg.period || KpiPeriod.Day;
      const period: KpiPeriod = allowedPeriods.includes(requested) ? requested : KpiPeriod.Day;

      const summary = await AnalyticsService.getTenantKpiSummary({
        brancheId: brancheId ? String(brancheId) : undefined,
        startDate,
        endDate,
        period,
      });

      this.sendResponse(req, res, 200, [summary], 1);
    } catch (error) {
      console.error('Error fetching platform KPI summary:', error);
      this.sendErrorResponse(req, res, error);
    }
  }
}

