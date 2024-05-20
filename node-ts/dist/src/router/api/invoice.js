"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const InvoiceController = __importStar(require("../../controllers/api/invoice"));
// import checkAuth from '../../middleware/check-auth';
const sign_req_data_1 = __importDefault(require("../../middleware/sign-req-data"));
const router = express_1.default.Router();
// Route: POST /items (Create item)
// router.post(
//   '',
//   signReqData,
//   [
//     // Validation rules using express-validator
//     check('brancheId').notEmpty().withMessage('brancheId is required'),
//     check('categoryId').notEmpty().withMessage('category is required'),
//     check('clientId').notEmpty().withMessage('price is required'),
//   ],
//   async (req: Request, res: Response) => {
//     // Check for validation errors
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }
//     // Call controller method to create item
//     await InvoiceController.createItem(req, res);
//   }
// );
// Route: PUT /items/:id (Update item)
router.put('/lockBill/:id', sign_req_data_1.default, [
    // Validation rules using express-validator
    (0, express_validator_1.check)('branche').optional().notEmpty().withMessage('branche is required'),
    (0, express_validator_1.check)('address')
        .optional()
        .notEmpty()
        .withMessage('address is required')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to update item
    yield InvoiceController.updateLockBill(req, res);
}));
// Route: PUT /items/:id (Update item)
router.put('/updateMenuItems/:id', [
    // Validation rules using express-validator
    (0, express_validator_1.check)('branche').optional().notEmpty().withMessage('branche is required'),
    (0, express_validator_1.check)('address')
        .optional()
        .notEmpty()
        .withMessage('address is required')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to update item
    yield InvoiceController.updateItemMenuItems(req, res);
}));
// Route: PUT /items/:id (Update item)
router.put('/:id', [
    // Validation rules using express-validator
    (0, express_validator_1.check)('branche').optional().notEmpty().withMessage('branche is required'),
    (0, express_validator_1.check)('address')
        .optional()
        .notEmpty()
        .withMessage('address is required')
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // Call controller method to update item
    yield InvoiceController.updateItem(req, res);
}));
// Other routes for GET (Read) and DELETE operations...
router.get("", InvoiceController.getAllItems);
exports.default = router;
