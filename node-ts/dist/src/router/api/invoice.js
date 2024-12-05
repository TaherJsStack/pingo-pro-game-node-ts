"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const invoice_1 = require("../../controllers/api/invoice");
// import checkAuth from '../../middleware/check-auth';
const sign_req_data_1 = __importDefault(require("../../middleware/sign-req-data"));
const router = express_1.default.Router();
const invoiceController = new invoice_1.InvoiceController();
router.post('', sign_req_data_1.default, [
    // Validation rules using express-validator
    (0, express_validator_1.check)('brancheId').notEmpty().withMessage('brancheId is required'),
    // check('categoryId').notEmpty().withMessage('category is required'),
    // check('clientId').notEmpty().withMessage('client Id is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to create item
    await invoiceController.createNewInvoice(req, res);
});
// Route: PUT /items/:id (Update item)
router.put('/updateBill/:id', sign_req_data_1.default, [
    // Validation rules using express-validator
    (0, express_validator_1.check)('branche').optional().notEmpty().withMessage('branche is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to update item
    await invoiceController.updateBill(req, res);
});
// Route: PUT /items/:id (Update item)
router.put('/endCategoryBookStateInInvoice/:id', sign_req_data_1.default, [
    // Validation rules using express-validator
    (0, express_validator_1.check)('branche').optional().notEmpty().withMessage('branche is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to update item
    await invoiceController.endDeviceBookStateInInvoice(req, res);
});
// Route: PUT /items/:id (Update item)
router.put('/lockBill/:id', sign_req_data_1.default, [
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
    await invoiceController.updateLockBill(req, res);
});
// Route: PUT /items/:id (Update item)
router.put('/updateMenuItems/:id', [
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
    await invoiceController.updateItemMenuItems(req, res);
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
    await invoiceController.updateItem(req, res);
});
// Other routes for GET (Read) and DELETE operations...
router.get("", invoiceController.getAllItems);
exports.default = router;
