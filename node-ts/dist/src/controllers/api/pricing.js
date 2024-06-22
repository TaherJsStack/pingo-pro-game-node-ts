"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingController = void 0;
const mongoose_1 = require("mongoose");
const pricing_1 = __importDefault(require("../../models/pricing"));
const CRUDController_1 = require("../base/CRUDController");
class PricingController extends CRUDController_1.CRUDController {
    constructor() {
        super(pricing_1.default);
        // Update - PUT request handler
        this.updateCategoryStopAllCategoresReletedToBill = async (req, res) => {
            debugger;
            try {
                // Check if IDs are provided in the request body
                const ids = await req.body;
                if (!Array.isArray(ids) || ids.length === 0) {
                    res.status(400).json({ msg: 'Invalid or empty IDs array' });
                }
                // Convert IDs to ObjectId
                let objectIds = await ids.map((id) => new mongoose_1.Types.ObjectId(id));
                // Update multiple categories by IDs in the database
                const updatedItems = await pricing_1.default.updateMany({ _id: { $in: objectIds } }, { $set: { bookState: false } });
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
        };
    }
}
exports.PricingController = PricingController;
