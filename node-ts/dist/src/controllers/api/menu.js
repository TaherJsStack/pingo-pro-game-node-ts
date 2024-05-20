"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = void 0;
const menu_1 = __importDefault(require("../../models/menu"));
const { ObjectId } = require('mongoose').Types;
class MenuController {
    constructor() {
        this.createItem = async (req, res) => {
            try {
                const newItem = new menu_1.default(req.body);
                newItem.ownerId = new ObjectId(req.authData.id);
                const savedItem = await newItem.save();
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
            let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
            let { ownerId, brancheId } = filter;
            const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
            const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
            try {
                const items = await menu_1.default.find({ brancheId }).sort({ type: -1, activeState: -1, createdAt: -1 });
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
                let filter = {};
                // if (filterBy && filterValue) {
                //   filter[filterBy] = { $regex: new RegExp(filterValue, 'i') };
                // }
                const items = await menu_1.default.find(filter)
                    .skip((page - 1) * limit)
                    .limit(limit);
                const totalCount = await menu_1.default.countDocuments(filter);
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
                const item = await menu_1.default.findById(req.params.id);
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
                const updatedItem = await menu_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
        };
        this.deleteItem = async (req, res) => {
            try {
                const deletedItem = await menu_1.default.findByIdAndDelete(req.params.id);
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
    }
}
exports.MenuController = MenuController;
