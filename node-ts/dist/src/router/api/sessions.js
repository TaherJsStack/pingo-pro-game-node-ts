"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
// import checkAuth from '../../middleware/check-auth';
const sign_req_data_1 = __importDefault(require("../../middleware/sign-req-data"));
const session_1 = require("../../controllers/api/session");
const router = express_1.default.Router();
const sessionController = new session_1.SessionController();
// Route: POST /items (Create item)
router.post('', sign_req_data_1.default, [
    // Validation rules using express-validator
    (0, express_validator_1.check)('brancheId').notEmpty().withMessage('brancheId is required'),
    (0, express_validator_1.check)('categoryId').notEmpty().withMessage('category is required'),
    (0, express_validator_1.check)('clientId').notEmpty().withMessage('price is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to create item
    await sessionController.createItem(req, res);
});
// Route: PUT /items/:id (Update item)
router.put('/:id', [
    // Validation rules using express-validator
    (0, express_validator_1.check)('brancheId').notEmpty().withMessage('brancheId is required'),
    (0, express_validator_1.check)('categoryId').notEmpty().withMessage('categoryId is required'),
    (0, express_validator_1.check)('clientId').notEmpty().withMessage('clientId is required'),
], async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to update item
    await sessionController.updateItem(req, res);
});
// Other routes for GET (Read) and DELETE operations...
router.get("", sessionController.getAllItems);
router.delete('/:id', sessionController.deleteItem);
router.delete('/deleteSessionItem/:id/:endIn', sessionController.deleteSessionItem);
router.delete('/deleteAllReletedToBill/:id/:endIn', sessionController.deleteAllReletedToBill);
exports.default = router;
