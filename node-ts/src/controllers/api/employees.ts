import { IAuth } from '../../types';
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { generateBcryptHash } from '../../util/jwtUtil';
import { CRUDController } from '../base/CRUDController';
import { authRepository, passwordRepository } from '../../repositories/instances';


export class EmployeesController extends CRUDController<IAuth> {
    constructor() {
        super(authRepository);
    }

    checkEmail = (req: Request, res: Response, next: NextFunction): void => {
        authRepository.findOne({ email: req.params.email })
            .then((user: any) => {

                if (!user || user === null) { throw new Error('this email doesn\'t exist ') }
                if (user && !user['activeState']) { throw new Error('this account has been blocked ') }

                res.status(200).json({
                    userId: user._id,
                    message: 'Welcom....',
                    status: 200
                })
            })
            .catch((err: Error) => {

                res.status(500).json({
                    message: 'check Email' + err,
                    status: 500
                })
            })
    }

    updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        try {
            // Only allow resetting the password of a user that belongs to the caller's tenant.
            const target = await authRepository.findOne({ _id: req.body.id }, this.getScope(req));
            if (!target) {
                res.status(404).json({ message: 'user not found', status: 404 });
                return;
            }

            const bcryptHash = await generateBcryptHash(req.body.password, 10);
            await passwordRepository.updateMany({ userId: req.body.id }, { password: bcryptHash });
            res.status(200).json({
                message: "updated password successfully",
                status: 200
            });
        } catch (err: any) {
            res.status(500).json({
                message: err + ' update password ',
                status: 500
            });
        }
    }

    saveAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        let bcryptHash = await generateBcryptHash(req.body.password, 10)
        let password = await bcryptHash;
        const authData = (req as any).authData;
        const payload: any = { ...(req.body as any) };
        if (authData?.id) {
            payload.ownerId = new Types.ObjectId(authData.id);
        }
        // Pass the tenant scope so the new employee is stamped with the creator's tenantId
        // (BaseRepository.create injects scope.tenantId into the payload).
        authRepository.create(payload, this.getScope(req))
            .then(async (saved: any) => {

                let savedPassword = await saveNewPassword(saved._id, password)

                if (!savedPassword) {
                    await authRepository.deleteById(saved._id.toString())
                    throw new Error('new user not added !!!')
                }
                res.status(200)
                    .json({
                        success: true,
                        errors: [],
                        status: 200,
                        message: 'new employee added successfully',
                        data: [saved]
                    })
            })
            .catch((err: Error) => {
                res.status(500).json({
                    message: `login error ->  ${err.message}`,
                    status: 500,
                    success: true,
                    errors: [
                        `login error ->  ${err.message}`
                    ],
                    data: []
                });
            })
    }

    updateOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        try {
            const updatedItem = await authRepository.updateById(req.params.id, req.body as any, this.getScope(req));
            if (!updatedItem) {
                res.status(404).json({ msg: 'Item not found' });
                return;
            }
            res.status(201)
                .json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: 'updated successfully',
                    data: [updatedItem]
                });
        } catch (err: any) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }

    getById = (req: Request, res: Response, next: NextFunction): void => {
        authRepository.findOne({ _id: req.params.authId }, this.getScope(req))
            .then((member: any) => {

                if (member == null) {
                    throw new Error(' user no data found')
                }
                res.status(200).json({
                    member,
                    message: 'get member Info ::: DB',
                    status: 200
                })
            })
            .catch((err: Error) => {
                res.status(500).json({
                    message: `err => ::: error catch ${err.message}`,
                    status: 500
                })
            })
    }

    deleteOne = (req: Request, res: Response, next: NextFunction): void => {
        authRepository.deleteById(req.params.id, this.getScope(req))
            .then((admin: any) => {
                res.status(200).json({
                    admin: admin,
                    message: 'delete admin Done ::: DB',
                    status: 200
                })
            })
            .catch((err: Error) => {
                res.status(500).json({
                    message: `err => ::: error catch  ${err.message}`,
                    status: 500
                })
            })
    }

}

async function saveNewPassword(userId: string, password: string): Promise<any> {

    try {
        return await passwordRepository.create({ userId, password } as any);
    } catch (err) {
        throw Error('error in saving password')
    }
}
