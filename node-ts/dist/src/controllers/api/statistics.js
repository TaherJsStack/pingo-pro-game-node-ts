"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatisticsController = void 0;
const invoice_1 = __importDefault(require("../../models/invoice"));
const { ObjectId } = require('mongoose').Types;
class StatisticsController {
    constructor() {
        this.getGroupedInvoicesByClosedBy = async (req, res) => {
            // let filter: Filter = JSON.parse(req.query.Filter);
            let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
            let { ownerId, brancheId, startDate, endDate, activeState } = filter;
            // console.log('getGroupedInvoicesByClosedBy filter', filter);
            try {
                const invoices = await invoice_1.default.aggregate([
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
            }
            catch (error) {
                console.error("Error fetching grouped invoices:", error);
                res.status(500).json({
                    success: true,
                    errors: [error],
                    status: 200,
                    message: '',
                    data: [],
                });
            }
        };
    }
}
exports.StatisticsController = StatisticsController;
