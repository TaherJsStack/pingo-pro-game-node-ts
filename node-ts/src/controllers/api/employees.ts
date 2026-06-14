import { IAuth } from '../../types';
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { generateBcryptHash } from '../../util/jwtUtil';
import { CRUDController } from '../base/CRUDController';
import { NotFoundError } from '../../errors/AppError';
import { authRepository, passwordRepository } from '../../repositories/instances';

const ALLOWED_UPDATE_FIELDS = ['firstName', 'lastName', 'phone', 'image', 'role', 'description', 'permissions', 'brancheId'];

export class EmployeesController extends CRUDController<IAuth> {
    constructor() {
        super(authRepository);
    }

    updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const target = await authRepository.findOne({ _id: req.body.id }, this.getScope(req));
            if (!target) {
                this.sendErrorResponse(req, res, new NotFoundError('user not found'));
                return;
            }

            const bcryptHash = await generateBcryptHash(req.body.password, 10);
            await passwordRepository.updateMany({ userId: req.body.id }, { password: bcryptHash });
            this.sendResponse(req, res, 200, {}, undefined, 'updated password successfully');
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    }

    saveAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const password = await generateBcryptHash(req.body.password, 10);
        const authData = (req as any).authData;
        const payload: any = { ...(req.body as any) };
        if (authData?.id) {
            payload.ownerId = new Types.ObjectId(authData.id);
        }
        authRepository.create(payload, this.getScope(req))
            .then(async (saved: any) => {
                const savedPassword = await EmployeesController.saveNewPassword(saved._id, password);
                if (!savedPassword) {
                    await authRepository.deleteById(saved._id.toString());
                    throw new Error('new user not added !!!');
                }
                this.sendResponse(req, res, 201, [saved], undefined, 'new employee added successfully');
            })
            .catch((err: Error) => {
                this.sendErrorResponse(req, res, err);
            });
    }

    updateOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const allowed: Record<string, any> = {};
            for (const field of ALLOWED_UPDATE_FIELDS) {
                if (field in req.body) allowed[field] = req.body[field];
            }
            const updatedItem = await authRepository.updateById(req.params.id, allowed as any, this.getScope(req));
            if (!updatedItem) {
                this.sendErrorResponse(req, res, new NotFoundError('Item not found'));
                return;
            }
            this.sendResponse(req, res, 200, [updatedItem]);
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    }

    getById = (req: Request, res: Response, next: NextFunction): void => {
        authRepository.findOne({ _id: req.params.authId }, this.getScope(req))
            .then((member: any) => {
                if (member == null) {
                    throw new NotFoundError('user no data found');
                }
                this.sendResponse(req, res, 200, [member]);
            })
            .catch((err: Error) => {
                this.sendErrorResponse(req, res, err);
            });
    }

    deleteOne = (req: Request, res: Response, next: NextFunction): void => {
        authRepository.deleteById(req.params.id, this.getScope(req))
            .then((admin: any) => {
                this.sendResponse(req, res, 200, [admin], undefined, 'delete employee done');
            })
            .catch((err: Error) => {
                this.sendErrorResponse(req, res, err);
            });
    }

    private static async saveNewPassword(userId: string, password: string): Promise<any> {
        try {
            return await passwordRepository.create({ userId, password } as any);
        } catch (err) {
            throw new Error('error in saving password');
        }
    }
}
