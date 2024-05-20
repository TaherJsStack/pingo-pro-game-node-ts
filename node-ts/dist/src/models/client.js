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
const clientSchema = new mongoose_1.Schema({
    ownerId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Auth', required: true },
    brancheId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Branche', required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: new Date() },
    description: { type: String, default: '' },
}, {
    timestamps: true
});
// Custom validation to check uniqueness 
clientSchema.pre('validate', async function (next) {
    const existing = await mongoose_1.default.models.Client.findOne({
        phone: this.phone,
        brancheId: this.brancheId,
    });
    if (existing) {
        const error = new Error('Client must be unique for brancheId combination');
        this.invalidate('Client', error.message);
    }
    next();
});
exports.default = mongoose_1.default.model('Client', clientSchema);
