"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const invoiceSchema = new mongoose_1.Schema({
    createdBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Auth', required: true },
    closedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Auth' },
    brancheId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Branche', required: true },
    categoryId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Category', required: true },
    clientId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Client', required: true },
    sessionId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Session', required: true },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: new Date() },
    description: { type: String, default: '' },
    total: { type: Number, default: 0 },
    categoriesTotal: { type: Number, default: 0 },
    menuItemsTotal: { type: Number, default: 0 },
    categories: [
        {
            category: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Category', required: true },
            sessionId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Session', required: true },
            type: { type: String, default: 'open', required: true }, // open or match
            price: { type: Number, required: true },
            startIn: { type: String, required: true },
            endIn: { type: String },
        },
    ],
    menuItems: [
        {
            itemID: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Menu', required: true },
            itemName: { type: String, required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, default: 1 },
        },
    ],
}, {
    timestamps: true,
});
invoiceSchema.methods.calculateCategoriesTotal = async function () {
    try {
        let total = 0;
        this.categories.forEach((category) => {
            if (category.startIn && category.endIn) {
                // Parse the startIn and endIn strings into Date objects
                const startTime = new Date(category.startIn);
                const endTime = new Date(category.endIn);
                // Calculate duration in hours
                const durationMs = endTime.getTime() - startTime.getTime();
                const durationHours = durationMs / (1000 * 60 * 60); // Convert milliseconds to hours
                // Calculate quantity based on duration and price per hour
                const categoryTotal = durationHours * category.price;
                // Add categoryTotal to overall total
                total += categoryTotal;
            }
        });
        // Update the total field in the document
        this.categoriesTotal = total;
        await this.save();
        return this.categoriesTotal;
    }
    catch (error) {
        throw error;
    }
};
invoiceSchema.methods.calculateMenuItemsTotal = async function () {
    try {
        const total = this.menuItems.reduce((acc, item) => acc + item.quantity * item.price, 0);
        this.menuItemsTotal = total;
        await this.save();
        return this.menuItemsTotal;
    }
    catch (error) {
        console.log('calculateMenuItemsTotal ----> ', error);
        throw error;
    }
};
invoiceSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            this.total = this.menuItemsTotal + this.categoriesTotal;
        }
        else {
            this.total = this.menuItemsTotal + this.categoriesTotal;
        }
        next();
    }
    catch (error) {
        console.error('Error in pre-save middleware:', error);
        next(error);
    }
});
const Invoice = mongoose_1.default.model('Invoice', invoiceSchema);
exports.default = Invoice;
