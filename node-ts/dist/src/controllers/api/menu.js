"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = void 0;
const menu_1 = __importDefault(require("../../models/menu"));
const CRUDController_1 = require("./base/CRUDController");
class MenuController extends CRUDController_1.CRUDController {
    constructor() {
        super(menu_1.default);
    }
}
exports.MenuController = MenuController;
