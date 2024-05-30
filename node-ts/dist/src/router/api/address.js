"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sign_req_data_1 = __importDefault(require("../../middleware/sign-req-data"));
const address_1 = require("../../controllers/api/address");
const router = express_1.default.Router();
const addressController = new address_1.AddressController();
// Route: POST /items (Create item)
router.post('', sign_req_data_1.default, async (req, res) => {
    await addressController.createItem(req, res);
});
// Route: PUT /items/:id (Update item)
router.put('/:id', async (req, res) => {
    await addressController.updateItem(req, res);
});
router.get("", addressController.getAllItems);
router.delete('/:id', addressController.deleteItem);
exports.default = router;
