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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_unique_validator_1 = __importDefault(require("mongoose-unique-validator"));
const CategorySchema = new mongoose_1.Schema({
    ownerId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Auth', required: true },
    brancheId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Branche', required: true },
    category: { type: String, required: true },
    priceId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Pricing', required: true },
    price: { type: Number, default: 0 },
    type: { type: String, required: true },
    logo: { type: String, default: '' },
    description: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    bookState: { type: Boolean, default: false },
    createdAt: { type: Date, default: new Date() },
}, {
    timestamps: true
});
// Custom validation to check uniqueness of category for ownerId and brancheId combination
CategorySchema.pre('validate', async function (next) {
    const existingCategory = await mongoose_1.default.models.Category.findOne({
        category: next.category,
        brancheId: next.brancheId,
    });
    if (existingCategory) {
        const error = new Error('Category must be unique for brancheId combination');
        next.invalidate('category', error.message);
    }
    next();
});
CategorySchema.plugin(mongoose_unique_validator_1.default);
const CategoryModel = mongoose_1.default.model('Category', CategorySchema);
exports.default = CategoryModel;
