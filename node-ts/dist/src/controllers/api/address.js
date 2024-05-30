"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressController = void 0;
const CRUDController_1 = require("./base/CRUDController");
const address_1 = __importDefault(require("../../models/address"));
// interface CreateItemRequest extends Request {
//   body: IAddress;
//   authData: {
//     id: string;
//   };
// }
class AddressController extends CRUDController_1.CRUDController {
    constructor() {
        super(address_1.default);
    }
}
exports.AddressController = AddressController;
