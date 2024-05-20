import express from "express";
import {
    saveAuth,
    updateOne,
    updatePassword,
    getAllItems,
    checkEmail,
    getById,
    deleteOne,
} from "../../controllers/api/employees";

const employeesRouter = express.Router();

// Import middlewares if needed
// import signReqData from '../../middleware/sign-req-data';
// import checkAuth from '../../middleware/check-auth';
// import checkAdmin from '../../middleware/check-admin';
// import checkUpdate from '../../middleware/check-update';

employeesRouter.post("/", saveAuth);

employeesRouter.put("/member/:id", updateOne);

employeesRouter.put("/updatePassword", updatePassword);

employeesRouter.get("/", getAllItems);

employeesRouter.get("/checkEmail/:email", checkEmail);

employeesRouter.get("/getById/:authId", getById);

employeesRouter.delete("/:id", deleteOne);

export default employeesRouter;
