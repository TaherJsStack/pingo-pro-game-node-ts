"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRUDController = void 0;
const { ObjectId } = require('mongoose').Types;
const sendResponse_1 = require("./sendResponse");
class CRUDController extends sendResponse_1.SendResponse {
    constructor(model) {
        super();
        this.createItem = async (req, res) => {
            try {
                const newItem = new this.model(req.body);
                if ('ownerId' in this.model.schema.obj) {
                    newItem.$set('ownerId', new ObjectId(req.authData.id));
                }
                const savedItem = await newItem.save();
                this.sendResponse(res, 201, [savedItem]);
            }
            catch (err) {
                this.sendErrorResponse(res, err);
            }
        };
        this.getAllItems = async (req, res) => {
            try {
                const filter = this.parseFilter(req.query.Filter);
                // console.log('filter -->', filter);
                // console.log('filter -->', this.model);
                for (const property in filter) {
                    // console.log(`${property}: ${filter[property]}`);
                    if (!(property in this.model.schema.obj)) {
                        delete filter[property];
                    }
                }
                // console.log('filter -->', filter);
                const items = await this.model.find(filter).sort({ createdAt: -1, activeState: 1 });
                this.sendResponse(res, 200, items);
            }
            catch (err) {
                this.sendErrorResponse(res, err);
            }
        };
        this.getItemById = async (req, res) => {
            try {
                const item = await this.model.findById(req.params.id);
                if (!item) {
                    res.status(404).json({ msg: 'Item not found' });
                }
                this.sendResponse(res, 200, item);
            }
            catch (err) {
                this.sendErrorResponse(res, err);
            }
        };
        this.updateItem = async (req, res) => {
            try {
                const updatedItem = await this.model.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!updatedItem) {
                    res.status(404).json({ msg: 'Item not found' });
                }
                this.sendResponse(res, 200, [updatedItem]);
            }
            catch (err) {
                this.sendErrorResponse(res, err);
            }
        };
        this.deleteItem = async (req, res) => {
            try {
                const deletedItem = await this.model.findByIdAndDelete(req.params.id);
                if (!deletedItem) {
                    res.status(404).json({ msg: 'Item not found' });
                }
                this.sendResponse(res, 200, [deletedItem]);
            }
            catch (err) {
                this.sendErrorResponse(res, err);
            }
        };
        this.model = model;
    }
    // protected sendResponse(res: Response, statusCode: number, data: any) {
    //   res.status(statusCode).json({
    //     success: true,
    //     errors: [],
    //     status: statusCode,
    //     message: '',
    //     data: data,
    //   });
    // }
    // protected sendErrorResponse(res: Response, err: any) {
    //   console.error('Error:', err.message);
    //   res.status(500).json({
    //     success: false,
    //     errors: [err.message],
    //     status: 500,
    //     message: '',
    //     data: {},
    //   });
    // }
    parseFilter(filter) {
        try {
            return typeof filter === 'string' ? JSON.parse(filter) : {};
        }
        catch {
            return {};
        }
    }
}
exports.CRUDController = CRUDController;
