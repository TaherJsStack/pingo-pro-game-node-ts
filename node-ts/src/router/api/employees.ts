import express, { Router, Request, Response, NextFunction } from 'express';
import {EmployeesController} from "../../controllers/api/employees";
import signReqData from '../../middleware/sign-req-data';
import { check, validationResult } from 'express-validator';
import Auth from '../../models/auth';

const employeesRouter = express.Router();
const employeesController:EmployeesController = new EmployeesController();
const { saveAuth, updateOne, updatePassword, getAllItems, checkEmail, getById, deleteOne } = new EmployeesController();

// employeesRouter.post("/", saveAuth);

employeesRouter.post(
    '',
    signReqData,
    [
        //  Validation rules using express-validator
        //  check('branche').notEmpty().withMessage('branche is required'),
        //  check('address').notEmpty().withMessage('address is required'),
      check('email').notEmpty().withMessage('email is required'),
      check('email').isEmail().withMessage('Email is invalid'),
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      
      const { email } = req.body;
      const employee = await Auth.findOne({ email });
  
      if (employee) {
        return res.status(400).json({ errors: [{ path: 'email', msg: 'Email is already taken' }] });
      }

      // Call controller method to create item
    //   await saveAuth(req, res);
      await employeesController.saveAuth(req, res, next);
    
    }
  );

employeesRouter.put("/member/:id", signReqData, updateOne);

employeesRouter.put("/updatePassword", signReqData, updatePassword);

employeesRouter.get("/", signReqData, getAllItems);

employeesRouter.get("/checkEmail/:email", checkEmail);

employeesRouter.get("/getById/:authId", signReqData, getById);

employeesRouter.delete("/:id", signReqData, deleteOne);

export default employeesRouter;
