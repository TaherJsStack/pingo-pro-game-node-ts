"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const mongoose_1 = require("mongoose");
const session_1 = __importDefault(require("../../models/session"));
const invoice_service_1 = __importDefault(require("../../services/invoice.service"));
const { ObjectId } = require('mongoose').Types;
class SessionController {
    constructor() {
        this.createItem = async (req, res) => {
            try {
                // Create new item using request body
                let newItem = new session_1.default(req.body);
                newItem.createdBy = new ObjectId(req.authData.id);
                // Save item to database
                const savedItem = await newItem.save();
                invoice_service_1.default.setData({
                    message: 'Hello from Controller 1',
                    setDataTyep: 'create',
                    savedItem,
                });
                res.status(201).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: [savedItem],
                });
            }
            catch (err) {
                console.error('err.message -->', err.message);
                res.status(500).json({
                    success: false,
                    errors: [err.message],
                    status: 500,
                    message: '',
                    data: {},
                });
            }
        };
        this.getAllItems = async (req, res) => {
            // let filter = JSON.parse(req.query.Filter);
            let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
            let { ownerId, brancheId } = filter;
            const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
            const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
            try {
                // Fetch all items from database
                const items = await session_1.default.find({ brancheId }).sort({ createdAt: -1, activeState: 1 });
                res.status(201).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: items,
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.getAllItemsPagination = async (req, res) => {
            try {
                let { page = 1, limit = 10, filterBy, filterValue } = req.query;
                page = +page;
                limit = +limit;
                // Build filter object based on query parameters
                let filter = {};
                // if (filterBy && filterValue) {
                //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') }; // Case-insensitive regex search
                // }
                // Fetch items from database with pagination and filtering
                const items = await session_1.default.find(filter).skip((page - 1) * limit).limit(limit);
                // Count total number of items (for pagination)
                const totalCount = await session_1.default.countDocuments(filter);
                res.status(200).json({
                    success: true,
                    data: {
                        items,
                        pagination: {
                            currentPage: page,
                            totalPages: Math.ceil(totalCount / limit),
                            totalItems: totalCount,
                            itemsPerPage: limit,
                        },
                    },
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.getItemById = async (req, res) => {
            try {
                // Fetch item by ID from database
                const item = await session_1.default.findById(req.params.id);
                if (!item) {
                    return res.status(404).json({ msg: 'Item not found' });
                }
                res.status(201).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: {},
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.updateItem = async (req, res) => {
            try {
                // Update item by ID in database
                const updatedItem = await session_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!updatedItem) {
                    return res.status(404).json({ msg: 'Item not found' });
                }
                invoice_service_1.default.setData({
                    message: 'Hello from Controller 1',
                    setDataTyep: 'update',
                    updatedItem,
                });
                res.status(201).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: [updatedItem],
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.deleteItem = async (req, res) => {
            try {
                // Delete item by ID from database
                const deletedItem = await session_1.default.findByIdAndDelete(req.params.id);
                if (!deletedItem) {
                    return res.status(404).json({ msg: 'Item not found' });
                }
                res.status(201).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: [deletedItem],
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.deleteSessionItem = async (req, res) => {
            try {
                // Delete item by ID from database
                const deletedItem = await session_1.default.findByIdAndDelete(req.params.id);
                if (!deletedItem) {
                    return res.status(404).json({ msg: 'Item not found' });
                }
                invoice_service_1.default.setData({
                    message: 'Hello from Controller 1',
                    setDataTyep: 'end',
                    deletedItem,
                    endIn: req.params.endIn,
                });
                res.status(201).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: '',
                    data: [deletedItem],
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
        this.deleteAllReletedToBill = async (req, res) => {
            try {
                // console.log('deleteAllReletedToBill req.params', req.params);
                let ids = req.params.id.split(',');
                let idsToDelete = ids.map((id) => new mongoose_1.Types.ObjectId(id));
                let deletedList = await session_1.default.deleteMany({ _id: { $in: idsToDelete } });
                invoice_service_1.default.setData({
                    message: 'Hello from Controller 1',
                    setDataTyep: 'endList',
                    idsToDelete,
                    endIn: req.params.endIn,
                });
                res.status(201).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: ids,
                    data: ids,
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500).send('Server Error');
            }
        };
    }
}
exports.SessionController = SessionController;
