"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employees_1 = require("../../controllers/api/employees");
const employeesRouter = express_1.default.Router();
// Import middlewares if needed
// import signReqData from '../../middleware/sign-req-data';
// import checkAuth from '../../middleware/check-auth';
// import checkAdmin from '../../middleware/check-admin';
// import checkUpdate from '../../middleware/check-update';
employeesRouter.post("/", employees_1.saveAuth);
employeesRouter.put("/member/:id", employees_1.updateOne);
employeesRouter.put("/updatePassword", employees_1.updatePassword);
employeesRouter.get("/", employees_1.getAllItems);
employeesRouter.get("/checkEmail/:email", employees_1.checkEmail);
employeesRouter.get("/getById/:authId", employees_1.getById);
employeesRouter.delete("/:id", employees_1.deleteOne);
exports.default = employeesRouter;
