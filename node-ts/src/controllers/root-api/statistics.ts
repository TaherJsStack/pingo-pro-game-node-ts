// controllers/statisticsController.js
const mongoose = require('mongoose');
import { Request, Response } from 'express';
import { SendResponse } from '../base/sendResponse';
import Invoice from '../../models/invoice';
import AnalyticsService from '../../services/analytics.service';
import { KpiPeriod } from '../../enums/kpi-period.enum';
// import { SendResponse } from '../api/base/sendResponse';

export class StatisticsController extends SendResponse {
  constructor() {
    super();
    this.getCollectionStatistics = this.getCollectionStatistics.bind(this);
    this.getAggregate = this.getAggregate.bind(this);
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
      const statsObject = await stats.reduce((acc, stat) => {
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


  async getAggregate(req: Request, res: Response) {
    // console.log('getAggregate');
    try {
      const invoices = await Invoice.aggregate([
        {
          $match: {
            // createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            // brancheId: new ObjectId(brancheId),
            activeState: false,
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
        // {
        //   $group: {
        //     _id: "$_id",
        //     invoices: { $first: "$invoices" },
        //     invoicesTotal: { $first: "$invoicesTotal" },
        //     devicesTotal: { $first: "$devicesTotal" },
        //     menuItemsTotal: { $first: "$menuItemsTotal" },
        //     closedByUser: { $first: "$closedByUser" },
        //     invoicemenus: { $push: "$invoicemenus" },
        //     menuItemsPriceTotal: { $sum: { $multiply: ["$invoicemenus.price", "$invoicemenus.quantity"] } },
        //     menuItemsQuantityTotal: { $sum: "$invoicemenus.quantity" },
        //   },
        // },
        // {
        //   $addFields: {
        //     totalMenuItemsPrice: "$menuItemsPriceTotal",
        //     totalMenuItemsQuantity: "$menuItemsQuantityTotal",
        //   },
        // },

      ]);
      // const invoices = await Invoice.aggregate([
      //   {
      //     $match: {
      //       activeState: false,
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: "$closedBy",
      //       invoices: { $push: "$$ROOT" },
      //       invoicesTotal: { $sum: "$total" },
      //       devicesTotal: { $sum: "$devicesTotal" },
      //       menuItemsTotal: { $sum: "$menuItemsTotal" },
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'auths',
      //       localField: '_id',
      //       foreignField: '_id',
      //       as: 'closedByUser',
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'invoicemenus',
      //       localField: '_id',
      //       foreignField: 'closedBy',
      //       as: 'invoicemenus',
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: "$invoicemenus",
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },
      //   {
      //     $unwind: {
      //       path: "$invoicemenus.menuItems",
      //       preserveNullAndEmptyArrays: true,
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: "$_id",
      //       invoices: { $first: "$invoices" },
      //       invoicesTotal: { $first: "$invoicesTotal" },
      //       devicesTotal: { $first: "$devicesTotal" },
      //       menuItemsTotal: { $first: "$menuItemsTotal" },
      //       closedByUser: { $first: "$closedByUser" },
      //       invoicemenus: { $push: "$invoicemenus" },
      //       menuItemsPriceTotal: { $sum: { $multiply: ["$invoicemenus.menuItems.price", "$invoicemenus.menuItems.quantity"] } },
      //       menuItemsQuantityTotal: { $sum: "$invoicemenus.menuItems.quantity" },
      //     },
      //   },
      //   {
      //     $addFields: {
      //       totalMenuItemsPrice: "$menuItemsPriceTotal",
      //       totalMenuItemsQuantity: "$menuItemsQuantityTotal",
      //     },
      //   },
      // ]);

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

