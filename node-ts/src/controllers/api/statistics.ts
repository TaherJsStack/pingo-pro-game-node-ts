import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { invoiceRepository } from '../../repositories/instances';
import ShiftModel from '../../models/shift';
import SessionModel from '../../models/session';
import { KpiPeriod } from '../../enums/kpi-period.enum';
import { ShiftStatus } from '../../enums/shift-status.enum';
import AnalyticsService from '../../services/analytics.service';
const { ObjectId } = require('mongoose').Types;

interface Filter {
  ownerId: string;
  brancheId: string;
  startDate: string;
  endDate: string;
  activeState: boolean;
}

interface AuthenticatedRequest extends Request {
  authData?: {
    tenantId?: string;
  };
}

export class StatisticsController {
  private getTenantMatch(req: AuthenticatedRequest) {
    // Owner-facing statistics must always be tenant-scoped. Refuse (rather than aggregate
    // across every tenant) when the caller's token carries no tenantId. Cross-tenant platform
    // stats live in controllers/root-api/statistics.ts behind rootAuthGuard.
    const tenantId = req.authData?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant scope is required for statistics.');
    }
    return { tenantId: new ObjectId(tenantId) };
  }

  getGroupedInvoicesByClosedBy = async (req: AuthenticatedRequest, res: Response) => {
    // let filter: Filter = JSON.parse(req.query.Filter);

    let filterObg = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};

    let { ownerId, brancheId, filter } = filterObg;
    let { startDate, endDate, activeState } = filter;

    // console.log('getGroupedInvoicesByClosedBy filter', filterObg);

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
            _id: "$closedBy",
            invoices: { $push: "$$ROOT" },
            invoicesTotal: { $sum: "$total" },
            devicesTotal: { $sum: "$devicesTotal" },
            menuItemsTotal: { $sum: "$menuItemsTotal" },
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
        {
          $unwind: {
            path: "$closedByUser",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$invoicemenus",
            preserveNullAndEmptyArrays: true,
          },
        },

      ]);

      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: invoices,
      });
    } catch (error) {
      console.error("Error fetching grouped invoices:", error);
      res.status(500).json({
        success: true,
        errors: [error],
        status: 200,
        message: '',
        data: [],
      });
    }
  }
  getGroupedInvoicesByClosedByMemberId = async (req: AuthenticatedRequest, res: Response) => {
    // let filter: Filter = JSON.parse(req.query.Filter);
    let _id = req.params.id;
    let filterObg = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : req.query.Filter;

    let { ownerId, brancheId, filter, startDate, endDate, activeState } = filterObg;
    // let {  } = filter;

    // console.log('getGroupedInvoicesByClosedBy filter', filterObg);

    try {

      const invoices = await invoiceRepository.aggregate([
        {
          $match: {
            ...this.getTenantMatch(req),
            // createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            brancheId: new ObjectId(brancheId),
            activeState,
            closedBy: new ObjectId(_id),
          },
        },
        {
          $group: {
            _id: "$closedBy",
            invoices: { $push: "$$ROOT" },
            invoicesTotal: { $sum: "$total" },
            devicesTotal: { $sum: "$devicesTotal" },
            menuItemsTotal: { $sum: "$menuItemsTotal" },
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
        {
          $unwind: {
            path: "$closedByUser",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $unwind: {
            path: "$invoicemenus",
            preserveNullAndEmptyArrays: true,
          },
        },

        {
          $project: {
            "closedByUser._id": 1,
            "closedByUser.firstName": 1,
            "closedByUser.lastName": 1,
            "closedByUser.phone": 1,
            "closedByUser.image": 1,
            "closedByUser.activeState": 1,
            "closedByUser.role": 1,
            "closedByUser.permission": 1,
            "closedByUser.createdAt": 1,
            "closedByUser.description": 1,
            "closedByUser.authType": 1,
            "closedByUser.brancheId": 1,
            "closedByUser.email": 1,
            "closedByUser.updatedAt": 1,
            "closedByUser.__v": 1,
            invoices: {
              $map: {
                input: "$invoices",
                as: "invoice",
                in: {
                  _id: "$$invoice._id",
                  createdBy: "$$invoice.createdBy",
                  brancheId: "$$invoice.brancheId",
                  deviceId: "$$invoice.deviceId",
                  sessionId: "$$invoice.sessionId",
                  activeState: "$$invoice.activeState",
                  createdAt: "$$invoice.createdAt",
                  description: "$$invoice.description",
                  total: "$$invoice.total",
                  devicesTotal: "$$invoice.devicesTotal",
                  menuItemsTotal: "$$invoice.menuItemsTotal",
                  devices: "$$invoice.devices",
                  menuItems: "$$invoice.menuItems",
                  updatedAt: "$$invoice.updatedAt",
                  __v: "$$invoice.__v",
                  closedBy: "$$invoice.closedBy"
                }
              }
            }
          },
        },
      ]);

      res.status(201).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: invoices,
      });
    } catch (error) {
      console.error("Error fetching grouped invoices:", error);
      res.status(500).json({
        success: true,
        errors: [error],
        status: 200,
        message: '',
        data: [],
      });
    }
  }

  getTopCustomers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const filterObg = typeof req.query.Filter === 'string'
        ? JSON.parse(req.query.Filter)
        : ((req.query.Filter as any) || {});

      const innerFilter = filterObg.filter || filterObg;
      const brancheId = filterObg.brancheId || innerFilter.brancheId;
      const parsedLimit = Number(innerFilter.limit || filterObg.limit || 5);
      const limit = Number.isFinite(parsedLimit) ? Math.max(parsedLimit, 1) : 5;
      const createdAtMatch: any = {};

      if (innerFilter.startDate) {
        createdAtMatch.$gte = new Date(innerFilter.startDate);
      }

      if (innerFilter.endDate) {
        createdAtMatch.$lte = new Date(innerFilter.endDate);
      }

      const matchStage: any = {
        clientId: { $ne: null },
        ...this.getTenantMatch(req),
      };

      if (brancheId) {
        matchStage.brancheId = new ObjectId(brancheId);
      }

      if (Object.keys(createdAtMatch).length) {
        matchStage.createdAt = createdAtMatch;
      }

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
        {
          $lookup: {
            from: 'clients',
            localField: '_id',
            foreignField: '_id',
            as: 'client',
          },
        },
        {
          $unwind: {
            path: '$client',
            preserveNullAndEmptyArrays: true,
          },
        },
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

      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: customers,
      });
    } catch (error) {
      console.error('Error fetching top customers:', error);
      res.status(500).json({ success: false, errors: [String(error)], status: 500, message: '', data: [] });
    }
  }

  getKpiSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const tenantId = req.authData?.tenantId;
      if (!tenantId) {
        res.status(400).json({ success: false, errors: ['Tenant scope is required.'], status: 400, message: '', data: [] });
        return;
      }

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
        tenantId,
        brancheId: brancheId ? String(brancheId) : undefined,
        startDate,
        endDate,
        period,
      });

      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: [summary],
      });
    } catch (error) {
      console.error('Error fetching KPI summary:', error);
      res.status(500).json({ success: false, errors: [String(error)], status: 500, message: '', data: [] });
    }
  }
}
