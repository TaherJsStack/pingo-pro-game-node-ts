"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employees_1 = require("../../controllers/api/employees");
const sign_req_data_1 = __importDefault(require("../../middleware/sign-req-data"));
const express_validator_1 = require("express-validator");
const auth_1 = __importDefault(require("../../models/auth"));
const employeesRouter = express_1.default.Router();
const employeesController = new employees_1.EmployeesController();
const { saveAuth, updateOne, updatePassword, getAllItems, checkEmail, getById, deleteOne } = new employees_1.EmployeesController();
// employeesRouter.post("/", saveAuth);
employeesRouter.post('', sign_req_data_1.default, [
    //  Validation rules using express-validator
    //  check('branche').notEmpty().withMessage('branche is required'),
    //  check('address').notEmpty().withMessage('address is required'),
    (0, express_validator_1.check)('email').notEmpty().withMessage('email is required'),
    (0, express_validator_1.check)('email').isEmail().withMessage('Email is invalid'),
], async (req, res, next) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;
    const employee = await auth_1.default.findOne({ email });
    if (employee) {
        return res.status(400).json({ errors: [{ path: 'email', msg: 'Email is already taken' }] });
    }
    // Call controller method to create item
    //   await saveAuth(req, res);
    await employeesController.saveAuth(req, res, next);
});
employeesRouter.put("/member/:id", updateOne);
employeesRouter.put("/updatePassword", updatePassword);
employeesRouter.get("/", getAllItems);
employeesRouter.get("/checkEmail/:email", checkEmail);
employeesRouter.get("/getById/:authId", getById);
employeesRouter.delete("/:id", deleteOne);
exports.default = employeesRouter;
