import { TokenManager } from './token-manager';
import { Request, Response, NextFunction } from 'express';
import { generateBcryptHash, compareBcryptHash } from '../../util/jwtUtil';
import { IAuth } from '../../types';
import { IPassword } from '../../types';
import { SendResponse } from '../base/sendResponse';
import { authRepository, brancheRepository, passwordRepository } from '../../repositories/instances';
import { AuthService } from '../../services/auth.service';

const tokenManager: TokenManager = new TokenManager();
const authService = new AuthService();

export class AuthController extends SendResponse {

    private getScope(req: Request) {
        return { tenantId: (req as any).authData?.tenantId, requireTenant: true };
    }

    private parseFilter(filter: any) {
        try {
            if (typeof filter !== 'string') {
                return {};
            }

            return JSON.parse(filter);
        } catch {
            return {};
        }
    }

    checkPhone = async (req: Request, res: Response, next: NextFunction) => {
        // console.log('checkPhone req.params ---> ', req.params)
        try {
            let user: (IAuth | any) = await authRepository.findByPhone(req.params.phone)
            if (user && user['activeState']) {
                // console.log('checkPhone user ---> ', user)
                this.sendResponse(req, res, 201, [user]);
            }
            else {
                this.sendResponse(req, res, 201, []);
                // throw new Error('this phone doesn\'t exist or this account has been blocked');
            }
        } catch (err: any) {
            // console.log('catch checkPhone user ---> ', err)

            this.sendErrorResponse(req, res, err);
        }

    };

    checkEmail = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user: IAuth | any = await authRepository.findByEmail(req.params.email);
            if (!user || user === null) {
                throw new Error('this email doesn\'t exist');
            }
            if (user && !user['activeState']) {
                throw new Error('this account has been blocked');
            }

            this.sendResponse(req, res, 200, [user]);
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    };

    checkPassword = async (req: Request, res: Response, next: NextFunction) => {
        let { id } = req.params;
        let { password } = req.body;
        let confirmedPassword = await compareLoginPassword(req, id, password);
        if (!confirmedPassword) {
            this.sendErrorResponse(req, res, 'password not matched');
        } else {
            this.sendResponse(req, res, 200, confirmedPassword);
        }
    };

    updatePassword = async (req: Request, res: Response, next: NextFunction) => {

        // let { id, password } = req.params;
        let { id, password, oldPassword, confirmPassword } = req.body;
        let confirmedPassword = await compareLoginPassword(req, id, oldPassword);
        //console.log('confirmedPassword --->', confirmedPassword)
        if (!confirmedPassword) {
            this.sendErrorResponse(req, res, 'password not matched');
            return
        }

        try {
            let bcryptHash = await generateBcryptHash(password, 10);
            let saved = await passwordRepository.updateMany({ userId: id }, { password: bcryptHash })
            this.sendResponse(req, res, 200, saved);
        } catch (error) {
            this.sendErrorResponse(req, res, error);
        }

    };

    saveAuth = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { token, user } = await authService.register(req.body);
            this.sendResponse(req, res, 200, [user], 1, token);
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    };

    updateOne = async (req: Request, res: Response, next: NextFunction) => {
        // console.log('Auth updateOne', req.body);
        try {
            const updatedItem = await authRepository.updateById(req.params.id, req.body as any, this.getScope(req));
            if (!updatedItem) {
                res.status(404).json({ msg: 'Item not found' });
                return;
            }
            this.sendResponse(req, res, 200, [updatedItem]);
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    };

    refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        let { refreshToken } = req.body;
        let token = await tokenManager.refreshToken(refreshToken);
        this.sendResponse(req, res, 200, [token]);
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user: IAuth | any = await authRepository.findByEmail(req.body.email);
            if (!user || user === null) {
                throw new Error('email doesn\'t exist');
            }
            if (user && !user['activeState']) {
                throw new Error('this account has been blocked');
            }

            const confirmedPassword = await compareLoginPassword(req, user._id, req.body.password);
            if (!confirmedPassword) {
                throw new Error('password not matched');
            }

            const token = await tokenManager.generateToken({
                _id: user._id.toString(),
                email: user.email,
                name: user.lastName + ' ' + user.firstName,
                tenantId: user.tenantId?.toString?.() ?? user.tenantId,
                brancheId: user.brancheId?.toString?.() ?? null,
                role: user.role,
                permission: user.permission,
                permissions: user.permissions,
                authType: user.authType
            });

            this.sendResponse(req, res, 200, user, 1, token);
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    };

    getAll = (req: Request, res: Response, next: NextFunction) => {
        const pageSize = req.query.PageSize ? +req.query.PageSize : 10;
        const pageNo = req.query.PageNo ? +req.query.PageNo : 1;

        const filter = this.parseFilter(req.query.filter);
        const listType = req.query.listType as string;

        const scope = this.getScope(req);
        let fetchedList: IAuth[] = [];
        authRepository.find(filter, {
            sort: { createdAt: -1 },
            skip: pageSize * (pageNo - 1),
            limit: pageSize,
            scope,
        })
            .then((documents: IAuth[]) => {
                fetchedList = documents;
                return authRepository.countDocuments({}, scope);
            })
            .then((count: number) => {

                if (listType && listType === 'team') {
                    fetchedList = fetchedList.filter(user => user.role !== 3);
                }

                res.status(200).json({
                    message: "members fetched successfully!",
                    list: fetchedList,
                    count: count,
                    status: 200
                });
            })
            .catch((err: Error) => {

                res.status(500).json({
                    message: err + ' users fetched',
                    status: 500
                });
            });
    };

    getById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const member = await authRepository.findOne({ _id: req.params.id }, this.getScope(req));
            if (member == null) {
                throw new Error('user no data found { statusCode: 404 }');
            }

            this.sendResponse(req, res, 200, [member]);
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    };

    selectBranch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { brancheId } = req.body;
            const authData = (req as any).authData;

            const branch = await brancheRepository.findOne(
                { _id: brancheId, tenantId: authData.tenantId },
                { tenantId: authData.tenantId, requireTenant: true }
            );
            if (!branch) {
                return res.status(403).json({ message: 'Branch not found or access denied' });
            }

            const newToken = tokenManager.generateToken({
                _id: authData.id,
                email: authData.email,
                tenantId: authData.tenantId,
                brancheId: brancheId,
                role: authData.role,
                permission: authData.permission,
                permissions: authData.permissions,
                authType: authData.authType,
            });

            return res.status(200).json({ status: 200, message: newToken, success: true, errors: [] });
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    };

    deleteOne = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const admin = await authRepository.deleteById(req.params.id, this.getScope(req));
            this.sendResponse(req, res, 200, [admin]);
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    };

}

async function compareLoginPassword(req: Request, userId: string, userPassword: string) {
    try {
        let savedUserPassword: IPassword = await passwordRepository.findOne({ userId }) as IPassword;
        // console.log('user --> ', userData.password);
        if (!savedUserPassword) {
            throw new Error('no password to compare');
        }
        // let confirmedPassword = await tokenManager.verifyToken(token);
        return await compareBcryptHash(userPassword, savedUserPassword.password);

    } catch (error) {
        console.log('compareLoginPassword -->', error);
        throw error;
    }
}
