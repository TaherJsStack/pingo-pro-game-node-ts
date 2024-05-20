"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const mongoose_1 = require("mongoose");
const category_1 = __importDefault(require("../../models/category"));
const { ObjectId } = require('mongoose').Types;
class CategoryController {
    constructor() {
        // Create - POST request handler
        this.createItem = async (req, res) => {
            try {
                // Create new item using request body
                const newItem = new category_1.default(req.body);
                newItem.ownerId = new ObjectId(req.authData.id);
                // Save item to database
                const savedItem = await newItem.save();
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
        };
        // Read - GET request handler (Get all items)
        this.getAllItems = async (req, res) => {
            // let filter = JSON.parse(req.query.Filter);
            let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
            let { ownerId, brancheId } = filter;
            const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
            const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
            try {
                // Fetch all items from database
                const items = await category_1.default.find({ brancheId }).sort({ type: -1, activeState: -1, createdAt: -1 });
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
        };
        // Read - GET request handler (Get all items with pagination and filtering)
        this.getAllItemsPagination = async (req, res) => {
            try {
                let { page = 1, limit = 10, filterBy, filterValue } = req.query;
                // Build filter object based on query parameters
                let filter = {};
                // if (filterBy && filterValue) {
                //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') }; // Case-insensitive regex search
                // }
                // Fetch items from database with pagination and filtering
                const items = await category_1.default.find(filter)
                    .skip((+page - 1) * +limit)
                    .limit(+limit);
                // Count total number of items (for pagination)
                const totalCount = await category_1.default.countDocuments(filter);
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
        };
        // Read - GET request handler (Get item by ID)
        this.getItemById = async (req, res) => {
            try {
                // Fetch item by ID from database
                const item = await category_1.default.findById(req.params.id);
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
        };
        // Update - PUT request handler
        this.updateCategoryStopAllCategoresReletedToBill = async (req, res) => {
            try {
                // Check if IDs are provided in the request body
                const ids = await req.body;
                if (!Array.isArray(ids) || ids.length === 0) {
                    res.status(400).json({ msg: 'Invalid or empty IDs array' });
                }
                // Convert IDs to ObjectId
                let objectIds = await ids.map(id => new mongoose_1.Types.ObjectId(id));
                // Update multiple categories by IDs in the database
                const updatedItems = await category_1.default.updateMany({ _id: { $in: objectIds } }, { $set: { bookState: false } });
                if (!updatedItems) {
                    res.status(404).json('No categories updated');
                }
                res.status(200).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: 'Categories updated successfully',
                    data: ids
                });
            }
            catch (err) {
                console.error(err.message);
                res.status(500)
                    .json({
                    success: false,
                    errors: [],
                    status: 200,
                    message: 'ERROR:: Stop All Categores Releted To Bill',
                    data: err
                });
            }
        };
        // Update - PUT request handler
        this.updateItem = async (req, res) => {
            try {
                // Update item by ID in database
                const updatedItem = await category_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
        };
        // Delete - DELETE request handler
        this.deleteItem = async (req, res) => {
            try {
                // Delete item by ID from database
                const deletedItem = await category_1.default.findByIdAndDelete(req.params.id);
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
        };
    }
}
exports.CategoryController = CategoryController;
