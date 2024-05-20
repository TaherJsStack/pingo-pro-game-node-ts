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
exports.deleteAllReletedToBill = exports.deleteSessionItem = exports.deleteItem = exports.updateItem = exports.getItemById = exports.getAllItemsPagination = exports.getAllItems = exports.createItem = void 0;
const mongoose_1 = require("mongoose");
const session_1 = __importDefault(require("../../models/session"));
const invoice_service_1 = __importDefault(require("../../services/invoice.service"));
const { ObjectId } = require('mongoose').Types;
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create new item using request body
        let newItem = new session_1.default(req.body);
        newItem.createdBy = new ObjectId(req.authData.id);
        // Save item to database
        const savedItem = yield newItem.save();
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
});
exports.createItem = createItem;
const getAllItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // let filter = JSON.parse(req.query.Filter);
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    let { ownerId, brancheId } = filter;
    const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
    try {
        // Fetch all items from database
        const items = yield session_1.default.find({ brancheId }).sort({ createdAt: -1, activeState: 1 });
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
});
exports.getAllItems = getAllItems;
const getAllItemsPagination = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const items = yield session_1.default.find(filter).skip((page - 1) * limit).limit(limit);
        // Count total number of items (for pagination)
        const totalCount = yield session_1.default.countDocuments(filter);
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
});
exports.getAllItemsPagination = getAllItemsPagination;
const getItemById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch item by ID from database
        const item = yield session_1.default.findById(req.params.id);
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
});
exports.getItemById = getItemById;
const updateItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Update item by ID in database
        const updatedItem = yield session_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
});
exports.updateItem = updateItem;
const deleteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Delete item by ID from database
        const deletedItem = yield session_1.default.findByIdAndDelete(req.params.id);
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
});
exports.deleteItem = deleteItem;
const deleteSessionItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Delete item by ID from database
        const deletedItem = yield session_1.default.findByIdAndDelete(req.params.id);
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
});
exports.deleteSessionItem = deleteSessionItem;
const deleteAllReletedToBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('deleteAllReletedToBill req.params', req.params);
        let ids = req.params.id.split(',');
        let idsToDelete = ids.map((id) => new mongoose_1.Types.ObjectId(id));
        let deletedList = yield session_1.default.deleteMany({ _id: { $in: idsToDelete } });
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
});
exports.deleteAllReletedToBill = deleteAllReletedToBill;
