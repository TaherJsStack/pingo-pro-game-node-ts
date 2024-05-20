"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const employees_1 = require("../../controllers/api/employees");
const employeesRouter = express_1.default.Router();
const { saveAuth, updateOne, updatePassword, getAllItems, checkEmail, getById, deleteOne } = new employees_1.EmployeesController();
employeesRouter.post("/", saveAuth);
employeesRouter.put("/member/:id", updateOne);
employeesRouter.put("/updatePassword", updatePassword);
employeesRouter.get("/", getAllItems);
employeesRouter.get("/checkEmail/:email", checkEmail);
employeesRouter.get("/getById/:authId", getById);
employeesRouter.delete("/:id", deleteOne);
exports.default = employeesRouter;
