import { Response } from 'express';
import { Types } from 'mongoose';
import { MaybeAuthenticatedRequest } from '../../types/auth';
import { invoiceRepository } from '../../repositories/instances';
import ShiftModel from '../../models/shift';
import SessionModel from '../../models/session';
import { KpiPeriod } from '../../enums/kpi-period.enum';
import { ShiftStatus } from '../../enums/shift-status.enum';
import AnalyticsService from '../../services/analytics.service';
import { SendResponse } from '../base/sendResponse';
import { parseFilter } from '../../util/parse-filter';
const { ObjectId } = require('mongoose').Types;

export class StatisticsController extends SendResponse {
  private getTenantMatch(req: MaybeAuthenticatedRequest) {
    const tenantId = req.authData?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant scope is required for statistics.');
    }
    return { tenantId: new ObjectId(tenantId) };
  }

  getGroupedInvoicesByClosedBy = async (req: MaybeAuthenticatedRequest, res: Response) => {
    const filterObg = parseFilter(req.query.Filter);
    const { ownerId, filter } = filterObg;
    const brancheId = req.authData?.brancheId;
    const { startDate, endDate, activeState } = filter ?? {};

    try {
      const invoices = await invoiceRepository.aggregate([
        {
          $match: {
            ...this.getTenantMatch(req),
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            brancheId: new ObjectId(brancheId),
            activeState,
          },
        },
        {
          $group: {
            _id: '$closedBy',
            invoices: { $push: '$$ROOT' },
            invoicesTotal: { $sum: '$total' },
            devicesTotal: { $sum: '$devicesTotal' },
            menuItemsTotal: { $sum: '$menuItemsTotal' },
          },
        },
        {
          $lookup: {
            from: 'auths',
            localField: '_id',
            foreignField: '_id',
            as: 'closedByUser',
          },
        },
        {
          $lookup: {
            from: 'invoicemenus',
            localField: '_id',
            foreignField: 'closedBy',
            as: 'invoicemenus',
          },
        },
        { $unwind: { path: '$closedByUser', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$invoicemenus', preserveNullAndEmptyArrays: true } },
      ]);

      this.sendResponse(req, res, 200, invoices);
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getTopCustomers = async (req: MaybeAuthenticatedRequest, res: Response) => {
    try {
      const filterObg = parseFilter(req.query.Filter);
      const innerFilter = filterObg.filter || filterObg;
      const brancheId = req.authData?.brancheId;
      const parsedLimit = Number(innerFilter.limit || filterObg.limit || 5);
      const limit = Number.isFinite(parsedLimit) ? Math.max(parsedLimit, 1) : 5;
      const createdAtMatch: any = {};

      if (innerFilter.startDate) createdAtMatch.$gte = new Date(innerFilter.startDate);
      if (innerFilter.endDate) createdAtMatch.$lte = new Date(innerFilter.endDate);

      const matchStage: any = {
        clientId: { $ne: null },
        ...this.getTenantMatch(req),
      };
      if (brancheId) matchStage.brancheId = new ObjectId(brancheId);
      if (Object.keys(createdAtMatch).length) matchStage.createdAt = createdAtMatch;

      const customers = await invoiceRepository.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$clientId',
            totalSpent: { $sum: '$total' },
            sessionsCount: { $sum: 1 },
            name: { $first: '$name' },
            phone: { $first: '$phone' },
          },
        },
        { $sort: { totalSpent: -1 } },
        { $limit: limit },
        { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
        { $unwind: { path: '$client', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 0,
            clientId: '$_id',
            name: { $ifNull: ['$client.name', '$name'] },
            phone: { $ifNull: ['$client.phone', '$phone'] },
            totalSpent: { $round: ['$totalSpent', 2] },
            sessionsCount: 1,
          },
        },
      ]);

      this.sendResponse(req, res, 200, customers);
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };

  getKpiSummary = async (req: MaybeAuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.authData?.tenantId;
      if (!tenantId) {
        this.sendErrorResponse(req, res, { statusCode: 400, message: 'Tenant scope is required.' });
        return;
      }

      const filterObg =
        typeof req.query.Filter === 'string'
          ? JSON.parse(req.query.Filter)
          : ((req.query.Filter as any) || {});

      const innerFilter = filterObg.filter || filterObg;
      const brancheId = req.authData?.brancheId;
      const startDate = innerFilter.startDate ? new Date(innerFilter.startDate) : new Date(0);
      const endDate = innerFilter.endDate ? new Date(innerFilter.endDate) : new Date();
      const allowedPeriods: KpiPeriod[] = Object.values(KpiPeriod);
      const requested = innerFilter.period || filterObg.period || KpiPeriod.Day;
      const period: KpiPeriod = allowedPeriods.includes(requested) ? requested : KpiPeriod.Day;

      const summary = await AnalyticsService.getTenantKpiSummary({
        tenantId,
        brancheId: brancheId ? String(brancheId) : undefined,
        startDate,
        endDate,
        period,
      });

      this.sendResponse(req, res, 200, [summary]);
    } catch (err) {
      this.sendErrorResponse(req, res, err);
    }
  };
}
