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
exports.deleteItem = exports.updateItem = exports.getItemById = exports.getAllItemsPagination = exports.getAllItems = exports.createItem = void 0;
const client_1 = __importDefault(require("../../models/client"));
const { ObjectId } = require('mongoose').Types;
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let newItem = new client_1.default(req.body);
        newItem.ownerId = new ObjectId(req.authData.id);
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
const getAllItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    let { ownerId, brancheId } = filter;
    const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
    try {
        const items = yield client_1.default.find({ brancheId }).sort({ createdAt: -1, activeState: 1 });
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
        let filter = {};
        // if (filterBy && filterValue) {
        //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') };
        // }
        const items = yield client_1.default.find(filter)
            .skip((+page - 1) * +limit)
            .limit(+limit);
        const totalCount = yield client_1.default.countDocuments(filter);
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
const getItemById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const item = yield client_1.default.findById(req.params.id);
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
        const updatedItem = yield client_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) {
            return res.status(404).json({ msg: 'Item not found' });
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
const deleteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedItem = yield client_1.default.findByIdAndDelete(req.params.id);
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
