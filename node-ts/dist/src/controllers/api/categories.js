"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const mongoose_1 = require("mongoose");
const category_1 = __importDefault(require("../../models/category"));
const CRUDController_1 = require("./base/CRUDController");
// const { ObjectId } = require('mongoose').Types;
// interface CreateItemRequest extends Request {
//   authData: {
//     id: string;
//   };
//   body: ICategory;
// }
class CategoryController extends CRUDController_1.CRUDController {
    constructor() {
        super(category_1.default);
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
    }
}
exports.CategoryController = CategoryController;
