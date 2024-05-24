"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrancheController = void 0;
const branche_1 = __importDefault(require("../../models/branche"));
const CRUDController_1 = require("./base/CRUDController");
class BrancheController extends CRUDController_1.CRUDController {
    constructor() {
        super(branche_1.default);
    }
}
exports.BrancheController = BrancheController;
