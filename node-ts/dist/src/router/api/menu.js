"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const menu_1 = require("../../controllers/api/menu");
// import checkAuth from '../../middleware/check-auth';
const sign_req_data_1 = __importDefault(require("../../middleware/sign-req-data"));
const menu_2 = __importDefault(require("../../models/menu"));
const router = express_1.default.Router();
const menuController = new menu_1.MenuController();
// Route: POST /items (Create item)
router.post('', sign_req_data_1.default, [
    // Validation rules using express-validator
    (0, express_validator_1.check)('brancheId').notEmpty().withMessage('brancheId is required'),
    (0, express_validator_1.check)('name').notEmpty().withMessage('category is required'),
    (0, express_validator_1.check)('price').notEmpty().withMessage('price is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name } = req.body;
    const isName = await menu_2.default.findOne({ name });
    if (isName) {
        return res.status(400).json({ errors: [{ path: 'name', msg: 'Name is already exists' }] });
    }
    // Call controller method to create item
    await menuController.createItem(req, res);
});
// Route: PUT /items/:id (Update item)
router.put('/:id', [
    // Validation rules using express-validator
    (0, express_validator_1.check)('branche').optional().notEmpty().withMessage('branche is required'),
    (0, express_validator_1.check)('address')
        .optional()
        .notEmpty()
        .withMessage('address is required')
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to update item
    await menuController.updateItem(req, res);
});
// Other routes for GET (Read) and DELETE operations...
router.get("", menuController.getAllItems);
router.delete('/:id', menuController.deleteItem);
exports.default = router;
