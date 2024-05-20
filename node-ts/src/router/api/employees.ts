import express from "express";
import {EmployeesController} from "../../controllers/api/employees";

const employeesRouter = express.Router();

const { saveAuth, updateOne, updatePassword, getAllItems, checkEmail, getById, deleteOne } = new EmployeesController();

employeesRouter.post("/", saveAuth);

employeesRouter.put("/member/:id", updateOne);

employeesRouter.put("/updatePassword", updatePassword);

employeesRouter.get("/", getAllItems);

employeesRouter.get("/checkEmail/:email", checkEmail);

employeesRouter.get("/getById/:authId", getById);

employeesRouter.delete("/:id", deleteOne);

export default employeesRouter;
