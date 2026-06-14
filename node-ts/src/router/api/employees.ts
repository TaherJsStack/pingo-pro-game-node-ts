import express, { Router, Request, Response, NextFunction } from 'express';
import { EmployeesController } from '../../controllers/api/employees';
import signReqData from '../../middleware/sign-req-data';
import { check, validationResult } from 'express-validator';
import { authRepository } from '../../repositories/instances';

const employeesRouter = express.Router();
const employeesController = new EmployeesController();

employeesRouter.post(
    '',
    signReqData,
    [
        check('email').notEmpty().withMessage('email is required'),
        check('email').isEmail().withMessage('Email is invalid'),
    ],
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array().map((e: any) => e.msg), status: 400, message: '', data: {} });
        }

        const { email } = req.body;
        const scope = { tenantId: (req as any).authData?.tenantId, requireTenant: true };
        const existing = await authRepository.findOne({ email }, scope);

        if (existing) {
            return res.status(400).json({ success: false, errors: ['Email is already taken'], status: 400, message: '', data: {} });
        }

        await employeesController.saveAuth(req, res, next);
    }
);

employeesRouter.put('/member/:id', signReqData, employeesController.updateOne);

employeesRouter.put('/updatePassword', signReqData, employeesController.updatePassword);

employeesRouter.get('/', signReqData, employeesController.getAllItems);

employeesRouter.get('/getById/:authId', signReqData, employeesController.getById);

employeesRouter.delete('/:id', signReqData, employeesController.deleteOne);

export default employeesRouter;
