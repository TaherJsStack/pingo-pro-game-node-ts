"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressController = void 0;
const CRUDController_1 = require("./base/CRUDController");
const address_1 = __importDefault(require("../../models/address"));
const { ObjectId } = require('mongoose').Types;
// interface CreateItemRequest extends Request {
//   body: IAddress;
//   authData: {
//     id: string;
//   };
// }
class AddressController extends CRUDController_1.CRUDController {
    constructor() {
        super(address_1.default);
        this.createItemAuthAddress = async (res, auth) => {
            try {
                const newItem = new address_1.default();
                // newItem['ownerId'] = req['_id']
                // if ('ownerId' in this.model.schema.obj) {
                newItem.$set('ownerId', new ObjectId(auth._id));
                // }
                const savedItem = await newItem.save();
                return savedItem;
                // this.sendResponse(res, 201, [savedItem]);
            }
            catch (err) {
                // this.sendErrorResponse(res, err);
            }
        };
    }
}
exports.AddressController = AddressController;
