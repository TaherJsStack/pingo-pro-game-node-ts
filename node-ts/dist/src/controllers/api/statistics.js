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
            let filterObg = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
            let { ownerId, brancheId, filter } = filterObg;
            let { startDate, endDate, activeState } = filter;
            // console.log('getGroupedInvoicesByClosedBy filter', filterObg);
            try {
                const invoices = await invoice_1.default.aggregate([
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
                    // {
                    //   $match: {
                    //     createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                    //     brancheId: new ObjectId(brancheId),
                    //     activeState: activeState,
                    //   },
                    // },
                    // {
                    //   $group: {
                    //     _id: "$closedBy",
                    //     invoices: { $push: "$$ROOT" },
                    //     invoicesTotal: { $sum: "$total" },
                    //     categoriesTotal: { $sum: "$categoriesTotal" },
                    //     menuItemsTotal: { $sum: "$menuItemsTotal" },
                    //   },
                    // },
                    // {
                    //   $lookup: {
                    //     from: 'auths',
                    //     localField: '_id',
                    //     foreignField: '_id',
                    //     as: 'closedByUser',
                    //   },
                    // },
                    // {
                    //   $unwind: {
                    //     path: "$closedByUser",
                    //     preserveNullAndEmptyArrays: true,
                    //   },
                    // },
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
        this.getGroupedInvoicesByClosedByMemberId = async (req, res) => {
            // let filter: Filter = JSON.parse(req.query.Filter);
            let _id = req.params.id;
            let filterObg = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : req.query.Filter;
            let { ownerId, brancheId, filter, startDate, endDate, activeState } = filterObg;
            // let {  } = filter;
            // console.log('getGroupedInvoicesByClosedBy filter', filterObg);
            try {
                const invoices = await invoice_1.default.aggregate([
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
                            "closedByUser.permeation": 1,
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
                // console.log(invoices);
                // const invoices = await Invoice.aggregate([
                //   {
                //     $match: {
                //       // createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
                //       brancheId: new ObjectId(brancheId),
                //       activeState,
                //       closedBy: new ObjectId(_id),
                //     },
                //   },
                //   {
                //     $group: {
                //       _id: "$closedBy",
                //       invoices: { $push: "$$ROOT" },
                //       invoicesTotal: { $sum: "$total" },
                //       categoriesTotal: { $sum: "$categoriesTotal" },
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
                //       path: "$closedByUser",
                //       preserveNullAndEmptyArrays: true,
                //     },
                //   },
                //   {
                //     $unwind: {
                //       path: "$invoicemenus",
                //       preserveNullAndEmptyArrays: true,
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
