"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGroupedInvoicesByClosedBy = void 0;
const invoice_1 = __importDefault(require("../../models/invoice"));
const { ObjectId } = require('mongoose').Types;
const getGroupedInvoicesByClosedBy = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // let filter: Filter = JSON.parse(req.query.Filter);
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    let { ownerId, brancheId, startDate, endDate, activeState } = filter;
    console.log('filter', filter);
    try {
        const invoices = yield invoice_1.default.aggregate([
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
});
exports.getGroupedInvoicesByClosedBy = getGroupedInvoicesByClosedBy;
