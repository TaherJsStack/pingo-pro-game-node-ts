import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { invoiceRepository } from '../../repositories/instances';
import ShiftModel from '../../models/shift';
import SessionModel from '../../models/session';
import { KpiPeriod } from '../../enums/kpi-period.enum';
import { ShiftStatus } from '../../enums/shift-status.enum';
const { ObjectId } = require('mongoose').Types;

interface Filter {
  ownerId: string;
  brancheId: string;
  startDate: string;
  endDate: string;
  activeState: boolean;
}

export class StatisticsController {
  getGroupedInvoicesByClosedBy = async (req: Request, res: Response) => {
    // let filter: Filter = JSON.parse(req.query.Filter);

    let filterObg = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};

    let { ownerId, brancheId, filter } = filterObg;
    let { startDate, endDate, activeState } = filter;

    // console.log('getGroupedInvoicesByClosedBy filter', filterObg);

    try {
      const invoices = await invoiceRepository.aggregate([

        {
          $match: {
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
            categoriesTotal: { $sum: "$categoriesTotal" },
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
  getGroupedInvoicesByClosedByMemberId = async (req: Request, res: Response) => {
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
            categoriesTotal: { $sum: "$categoriesTotal" },
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
                  categoryId: "$$invoice.categoryId",
                  sessionId: "$$invoice.sessionId",
                  activeState: "$$invoice.activeState",
                  createdAt: "$$invoice.createdAt",
                  description: "$$invoice.description",
                  total: "$$invoice.total",
                  categoriesTotal: "$$invoice.categoriesTotal",
                  menuItemsTotal: "$$invoice.menuItemsTotal",
                  categories: "$$invoice.categories",
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

  getTopCustomers = async (req: Request, res: Response) => {
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

  getKpiSummary = async (req: Request, res: Response) => {
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

      const branchMatch: any = brancheId ? { brancheId: new ObjectId(brancheId) } : {};

      // Revenue + invoice count bucketed by period (closed invoices only)
      const revenueByPeriod = await invoiceRepository.aggregate([
        { $match: { ...branchMatch, activeState: false, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: period } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: '$_id', total: { $round: ['$total', 2] }, count: 1 } },
      ]);

      // Worked hours bucketed by period (from closed shifts)
      const workedHoursByPeriod = await ShiftModel.aggregate([
        { $match: { ...branchMatch, status: ShiftStatus.Closed, openedAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $dateTrunc: { date: '$openedAt', unit: period } }, workedMinutes: { $sum: '$workedMinutes' } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: '$_id', total: { $round: [{ $divide: ['$workedMinutes', 60] }, 2] }, count: '$workedMinutes' } },
      ]);

      // Sessions started bucketed by period
      const sessionsStartedByPeriod = await SessionModel.aggregate([
        { $match: { ...branchMatch, createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $dateTrunc: { date: '$createdAt', unit: period } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: '$_id', count: 1 } },
      ]);

      // Sessions ended bucketed by period (a device "ends" when its category gets an endTime)
      const sessionsEndedByPeriod = await SessionModel.aggregate([
        { $match: { ...branchMatch } },
        { $unwind: '$categories' },
        { $match: { 'categories.endTime': { $gte: startDate, $lte: endDate } } },
        { $group: { _id: { $dateTrunc: { date: '$categories.endTime', unit: period } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, period: '$_id', count: 1 } },
      ]);

      // Worked hours + activity per employee (from closed shifts)
      const workedHoursByEmployee = await ShiftModel.aggregate([
        { $match: { ...branchMatch, status: ShiftStatus.Closed, openedAt: { $gte: startDate, $lte: endDate } } },
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
            employeeId: '$_id',
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
      ]);

      const totalRevenue = revenueByPeriod.reduce((sum: number, r: any) => sum + (r.total || 0), 0);
      const totalWorkedMinutes = workedHoursByEmployee.reduce((sum: number, e: any) => sum + (e.workedMinutes || 0), 0);
      const totalSessionsStarted = sessionsStartedByPeriod.reduce((sum: number, s: any) => sum + (s.count || 0), 0);
      const totalSessionsEnded = sessionsEndedByPeriod.reduce((sum: number, s: any) => sum + (s.count || 0), 0);

      res.status(200).json({
        success: true,
        errors: [],
        status: 200,
        message: '',
        data: [
          {
            period,
            startDate,
            endDate,
            totals: {
              revenue: Math.round(totalRevenue * 100) / 100,
              workedHours: Math.round((totalWorkedMinutes / 60) * 100) / 100,
              workedMinutes: totalWorkedMinutes,
              sessionsStarted: totalSessionsStarted,
              sessionsEnded: totalSessionsEnded,
            },
            revenueByPeriod,
            workedHoursByPeriod,
            sessionsStartedByPeriod,
            sessionsEndedByPeriod,
            workedHoursByEmployee,
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching KPI summary:', error);
      res.status(500).json({ success: false, errors: [String(error)], status: 500, message: '', data: [] });
    }
  }
}
