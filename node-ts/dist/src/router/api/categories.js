"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const categories_1 = require("../../controllers/api/categories");
const sign_req_data_1 = __importDefault(require("../../middleware/sign-req-data"));
// import { ICategory } from '../../models/category';
const router = express_1.default.Router();
const categoryController = new categories_1.CategoryController();
// Route: POST /items (Create item)
router.post('', sign_req_data_1.default, [
    // Validation rules using express-validator
    (0, express_validator_1.check)('brancheId').notEmpty().withMessage('brancheId is required'),
    (0, express_validator_1.check)('category').notEmpty().withMessage('category is required'),
    (0, express_validator_1.check)('priceId').notEmpty().withMessage('price is required'),
    (0, express_validator_1.check)('type').notEmpty().withMessage('type is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to create item
    await categoryController.createItem(req, res);
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
    await categoryController.updateItem(req, res);
});
// Route: PUT /updateCategoryStopAllCategoresReletedToBill/:id (Stop all related categories)
router.put('/updateCategoryStopAllCategoresReletedToBill/:id', async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to update item
    await categoryController.updateCategoryStopAllCategoresReletedToBill(req, res);
});
// Route: GET /items (Get all items)
router.get('', categoryController.getAllItems);
// Route: GET /items/pagination (Get all items with pagination)
// router.get('/pagination', categoryController.getAllItemsPagination);
// Route: GET /items/:id (Get item by ID)
router.get('/:id', categoryController.getItemById);
// Route: DELETE /items/:id (Delete item)
router.delete('/:id', categoryController.deleteItem);
exports.default = router;
