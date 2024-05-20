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
exports.deleteItem = exports.updateItem = exports.updateCategoryStopAllCategoresReletedToBill = exports.getItemById = exports.getAllItemsPagination = exports.getAllItems = exports.createItem = void 0;
const mongoose_1 = require("mongoose");
const pricing_1 = __importDefault(require("../../models/pricing"));
const { ObjectId } = require('mongoose').Types;
// Create - POST request handler
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create new item using request body
        const newItem = new pricing_1.default(req.body);
        newItem.ownerId = new ObjectId(req.authData.id);
        // Save item to database
        const savedItem = yield newItem.save();
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
// Read - GET request handler (Get all items)
const getAllItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // let filter: { ownerId?: string; brancheId?: string } = JSON.parse(req.query.Filter);
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    let { ownerId, brancheId } = filter;
    const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
    try {
        // Fetch all items from database
        const items = yield pricing_1.default.find({ brancheId }).sort({ type: 1, createdAt: -1, activeState: -1 });
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
// Read - GET request handler (Get all items with pagination and filtering)
const getAllItemsPagination = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let { page = 1, limit = 10, filterBy, filterValue } = req.query;
        // Build filter object based on query parameters
        let filter = {};
        // if (filterBy && filterValue) {
        //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') }; // Case-insensitive regex search
        // }
        // Fetch items from database with pagination and filtering
        const items = yield pricing_1.default.find(filter)
            .skip((+page - 1) * +limit)
            .limit(+limit);
        // Count total number of items (for pagination)
        const totalCount = yield pricing_1.default.countDocuments(filter);
        res.status(200).json({
            success: true,
            data: {
                items,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCount / +limit),
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
// Read - GET request handler (Get item by ID)
const getItemById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch item by ID from database
        const item = yield pricing_1.default.findById(req.params.id);
        if (!item) {
            res.status(404).json({ msg: 'Item not found' });
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
// Update - PUT request handler
const updateCategoryStopAllCategoresReletedToBill = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    debugger;
    try {
        // Check if IDs are provided in the request body
        const ids = yield req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
            res.status(400).json({ msg: 'Invalid or empty IDs array' });
        }
        // Convert IDs to ObjectId
        let objectIds = yield ids.map((id) => new mongoose_1.Types.ObjectId(id));
        // Update multiple categories by IDs in the database
        const updatedItems = yield pricing_1.default.updateMany({ _id: { $in: objectIds } }, { $set: { bookState: false } });
        if (updatedItems) {
            res.status(404).json({ msg: 'No categories updated' });
        }
        res.status(200).json({
            success: true,
            errors: [],
            status: 200,
            message: 'Categories updated successfully',
            data: ids,
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).json({
            success: false,
            errors: [],
            status: 200,
            message: 'ERROR:: Stop All Categores Releted To Bill',
            data: err,
        });
    }
});
exports.updateCategoryStopAllCategoresReletedToBill = updateCategoryStopAllCategoresReletedToBill;
// Update - PUT request handler
const updateItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Update item by ID in database
        const updatedItem = yield pricing_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) {
            res.status(404).json({ msg: 'Item not found' });
        }
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
// Delete - DELETE request handler
const deleteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Delete item by ID from database
        const deletedItem = yield pricing_1.default.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
            res.status(404).json({ msg: 'Item not found' });
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
