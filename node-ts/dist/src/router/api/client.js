"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const client_1 = require("../../controllers/api/client");
// import checkAuth from '../../middleware/check-auth';
const sign_req_data_1 = __importDefault(require("../../middleware/sign-req-data"));
const router = express_1.default.Router();
const clientController = new client_1.ClientController();
// Route: POST /items (Create item)
router.post('', sign_req_data_1.default, [
    // Validation rules using express-validator
    (0, express_validator_1.check)('brancheId').notEmpty().withMessage('brancheId is required'),
    (0, express_validator_1.check)('name').notEmpty().withMessage('name is required'),
    (0, express_validator_1.check)('phone').notEmpty().withMessage('price is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to create item
    await clientController.createItem(req, res);
});
// Route: PUT /items/:id (Update item)
router.put('/:id', [
    // Validation rules using express-validator
    (0, express_validator_1.check)('branche').optional().notEmpty().withMessage('branche is required'),
    (0, express_validator_1.check)('address').optional().notEmpty().withMessage('address is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to update item
    await clientController.updateItem(req, res);
});
// Other routes for GET (Read) and DELETE operations...
router.get('', clientController.getAllItems);
router.get('/check-phone/:phone', clientController.checkPhone);
router.delete('/:id', clientController.deleteItem);
exports.default = router;
