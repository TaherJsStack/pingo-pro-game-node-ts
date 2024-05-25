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
const authSchema = new mongoose_1.Schema({
    username: { type: String, default: 'Default' },
    firstName: { type: String, default: 'Default' },
    lastName: { type: String, default: 'Default' },
    email: { type: mongoose_1.Schema.Types.String, required: true, unique: true, match: /.+\@.+\..+/ },
    phone: { type: String, default: '' },
    image: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    role: { type: Number, required: true, default: 2 },
    permeation: { type: [Number], required: true, default: [2] },
    createdAt: { type: Date, default: Date.now },
    description: { type: String, default: '' },
    authType: { type: String, default: 'owner' }, // owner or employee or root
    brancheId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branche' },
}, {
    timestamps: true
});
authSchema.plugin(mongoose_unique_validator_1.default);
const Auth = mongoose_1.default.model('Auth', authSchema);
exports.default = Auth;
