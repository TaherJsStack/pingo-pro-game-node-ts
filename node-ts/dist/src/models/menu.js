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
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_unique_validator_1 = __importDefault(require("mongoose-unique-validator"));
const MenuSchema = new mongoose_1.Schema({
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Auth', required: true },
    brancheId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Branche', required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, required: true },
    logo: { type: String, default: '' },
    description: { type: String, default: '' },
    activeState: { type: Boolean, default: true },
    createdAt: { type: Date, default: new Date() },
}, {
    timestamps: true
});
// Custom validation to check uniqueness of menu for ownerId and brancheId combination
MenuSchema.pre('validate', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const existingMenu = yield mongoose_1.default.models.Menu.findOne({
            name: this.name,
            brancheId: this.brancheId,
        });
        if (existingMenu) {
            const error = new Error('Menu must be unique for brancheId combination');
            this.invalidate('menu', error.message);
        }
        next();
    });
});
MenuSchema.plugin(mongoose_unique_validator_1.default);
const MenuModel = mongoose_1.default.model('Menu', MenuSchema);
exports.default = MenuModel;
