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
exports.deleteItem = exports.updateItem = exports.getItemById = exports.getAllItems = exports.createItem = void 0;
const branche_1 = __importDefault(require("../../models/branche"));
const { ObjectId } = require('mongoose').Types;
// Create - POST request handler
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create new item using request body
        let newItem = new branche_1.default(req.body);
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
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    let { ownerId, brancheId } = filter;
    const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
    try {
        // Fetch all items from database
        const items = yield branche_1.default.find({ ownerId }).sort({ createdAt: -1, activeState: 1 });
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
// Read - GET request handler (Get item by ID)
const getItemById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Fetch item by ID from database
        const item = yield branche_1.default.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ msg: 'Item not found' });
        }
        res.status(201).json({
            success: true,
            errors: [],
            status: 200,
            message: '',
            data: [item],
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.getItemById = getItemById;
// Update - PUT request handler
const updateItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Update item by ID in database
        const updatedItem = yield branche_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) {
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
exports.updateItem = updateItem;
// Delete - DELETE request handler
const deleteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Delete item by ID from database
        const deletedItem = yield branche_1.default.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
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
exports.deleteItem = deleteItem;
