import { Request, Response } from 'express';
import { Types } from 'mongoose';
import Auth from '../../models/auth';
import Invoice from '../../models/invoice';
const { ObjectId } = require('mongoose').Types;

interface Filter {
  ownerId: string;
  brancheId: string;
  startDate: string;
  endDate: string;
  activeState: boolean;
}

export class StatisticsController{
  getGroupedInvoicesByClosedBy = async (req: Request, res: Response) => {
    // let filter: Filter = JSON.parse(req.query.Filter);
  
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
  
    let { ownerId, brancheId, startDate, endDate, activeState } = filter;
  
    console.log('filter', filter);
  
    try {
      const invoices = await Invoice.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
            brancheId: new ObjectId(brancheId),
            activeState: activeState,
          },
        },
        {
          $group: {
            _id: "$closedBy",
            invoices: { $push: "$$ROOT" },
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
          $unwind: {
            path: "$closedByUser",
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
}
