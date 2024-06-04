"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintsSuggestionController = void 0;
const complaints_suggestion_1 = __importDefault(require("../../models/complaints-suggestion"));
const CRUDController_1 = require("./base/CRUDController");
class ComplaintsSuggestionController extends CRUDController_1.CRUDController {
    constructor() {
        super(complaints_suggestion_1.default);
    }
}
exports.ComplaintsSuggestionController = ComplaintsSuggestionController;
