import { Model, Types } from 'mongoose';
import { IInvoice } from '../models/interfaces/invoice.interface';
import { BaseRepository } from './BaseRepository';
import { RepositoryScope } from './interfaces/IRepository';

const { ObjectId } = Types;

export class InvoiceRepository extends BaseRepository<IInvoice> {
  constructor(model: Model<any>) {
    super(model);
  }

  public async getInvoicesByEmployeeWithCounts(empId: string, scope?: RepositoryScope): Promise<{
    invoices: any[];
    treeInvoices: any[];
    totalInvoices: number;
    totalInvoicesClosedBy: number;
    totalInvoicesCreatedBy: number;
    sharedDevicesAdded: number;
    sharedDevicesClosed: number;
  }> {
    const employeeId = new ObjectId(empId);

    const invoices = await this.aggregate([
      {
        $match: { closedBy: employeeId },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            createdBy: '$createdBy',
          },
          invoices: { $push: '$$ROOT' },
          dailyTotal: { $sum: '$total' },
          createdByCount: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.date': -1 },
      },
    ], scope);

    const treeInvoices = await this.aggregate([
      {
        $match: { closedBy: employeeId },
      },
      {
        $addFields: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          week: { $isoWeek: '$createdAt' },
          dayOfWeek: { $dayOfWeek: '$createdAt' },
          dayName: {
            $arrayElemAt: [
              ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
              { $subtract: ['$dayOfWeek', 1] },
            ],
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            year: '$year',
            month: '$month',
            week: '$week',
            day: '$dayName',
          },
          invoices: { $push: '$$ROOT' },
        },
      },
      {
        $sort: { '_id.day': -1 },
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
            week: '$_id.week',
          },
          days: {
            $push: {
              dayTitle: '$_id.day',
              invoices: '$invoices',
            },
          },
        },
      },
      {
        $sort: { '_id.week': -1 },
      },
      {
        $group: {
          _id: {
            year: '$_id.year',
            month: '$_id.month',
          },
          weeks: {
            $push: {
              weekTitle: { $concat: ['Week ', { $toString: '$_id.week' }] },
              days: '$days',
            },
          },
        },
      },
      {
        $sort: { '_id.month': -1 },
      },
      {
        $group: {
          _id: '$_id.year',
          months: {
            $push: {
              monthTitle: {
                $arrayElemAt: [
                  [
                    'January',
                    'February',
                    'March',
                    'April',
                    'May',
                    'June',
                    'July',
                    'August',
                    'September',
                    'October',
                    'November',
                    'December',
                  ],
                  { $subtract: ['$_id.month', 1] },
                ],
              },
              weeks: '$weeks',
            },
          },
        },
      },
      {
        $sort: { _id: -1 },
      },
      {
        $project: {
          _id: 0,
          year: {
            yearTitle: '$_id',
            months: '$months',
          },
        },
      },
    ], scope);

    const totalInvoices = await this.countDocuments({}, scope);
    const totalInvoicesClosedBy = await this.countDocuments({ closedBy: employeeId }, scope);
    const totalInvoicesCreatedBy = await this.countDocuments({ createdBy: employeeId }, scope);
    const sharedDevicesAdded = await this.countDocuments({ 'categories.createdBy': employeeId }, scope);
    const sharedDevicesClosed = await this.countDocuments({ 'categories.closedBy': employeeId }, scope);

    return {
      invoices,
      treeInvoices,
      totalInvoices,
      totalInvoicesClosedBy,
      totalInvoicesCreatedBy,
      sharedDevicesAdded,
      sharedDevicesClosed,
    };
  }
}
