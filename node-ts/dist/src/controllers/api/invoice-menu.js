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
exports.deleteItem = exports.updateMenuItems = exports.updateMenuItemsLockOrders = exports.updateItem = exports.getItemById = exports.getAllItemsPagination = exports.getAllItems = exports.createItem = void 0;
const invoice_menu_1 = __importDefault(require("../../models/invoice-menu"));
const { ObjectId } = require('mongoose').Types;
// Create - POST request handler
const createItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Create new item using request body
        const newItem = new invoice_menu_1.default(req.body);
        newItem.createdBy = new ObjectId(req.authData.id);
        // Save item to database
        const savedItem = yield newItem.save();
        newItem.updateTotal()
            .then(total => {
            console.log('Updated total:', total);
        })
            .catch(error => {
            console.error('Error updating total:', error);
        });
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: '',
            data: [savedItem]
        });
    }
    catch (err) {
        console.error('err.message -->', err.message);
        res.status(500)
            .json({
            success: false,
            errors: [err.message],
            status: 500,
            message: '',
            data: {}
        });
        // .send('Server Error');
    }
});
exports.createItem = createItem;
// Read - GET request handler (Get all items)
const getAllItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // let filter = JSON.parse(req.query.Filter);
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    let { ownerId, brancheId } = filter;
    const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
    try {
        // Fetch all items from database
        const items = yield invoice_menu_1.default.find({ brancheId }).sort({ type: -1, activeState: -1, createdAt: -1 });
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: '',
            data: items
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
        const items = yield invoice_menu_1.default.find(filter)
            .skip((+page - 1) * +limit)
            .limit(+limit);
        // Count total number of items (for pagination)
        const totalCount = yield invoice_menu_1.default.countDocuments(filter);
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
        const item = yield invoice_menu_1.default.findById(req.params.id);
        if (!item) {
            res.status(404).json({ msg: 'Item not found' });
        }
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: '',
            data: {}
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
        const updatedItem = yield invoice_menu_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) {
            res.status(404).json({ msg: 'Item not found' });
        }
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: '',
            data: [updatedItem]
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.updateItem = updateItem;
// Update - PUT request handler
const updateMenuItemsLockOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        req.body.closedBy = new ObjectId(req.authData.id);
        req.body.activeState = false;
        // Update item by ID in database
        const updatedItem = yield invoice_menu_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) {
            res.status(404).json({ msg: 'Item not found' });
        }
        if (updatedItem) {
            updatedItem.updateTotal()
                .then(total => {
                console.log('Updated total:', total);
            })
                .catch(error => {
                console.error('Error updating total:', error);
            });
        }
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: '',
            data: [updatedItem]
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.updateMenuItemsLockOrders = updateMenuItemsLockOrders;
// Update - PUT request handler
const updateMenuItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Update item by ID in database
        const updatedItem = yield invoice_menu_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) {
            res.status(404).json({ msg: 'Item not found' });
        }
        if (updatedItem) {
            updatedItem.updateTotal()
                .then(total => {
                console.log('Updated total:', total);
            })
                .catch(error => {
                console.error('Error updating total:', error);
            });
        }
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: '',
            data: [updatedItem]
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.updateMenuItems = updateMenuItems;
// Delete - DELETE request handler
const deleteItem = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Delete item by ID from database
        const deletedItem = yield invoice_menu_1.default.findByIdAndDelete(req.params.id);
        if (!deletedItem) {
            res.status(404).json({ msg: 'Item not found' });
        }
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: '',
            data: [deletedItem]
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.deleteItem = deleteItem;
