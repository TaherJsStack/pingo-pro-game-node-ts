import { TokenManager } from './token-manager';
import { Request, Response, NextFunction } from 'express';
import { generateBcryptHash, compareBcryptHash } from '../../util/jwtUtil';
import { IAuth } from '../../types';
import { IPassword } from '../../types';
import { SendResponse } from '../base/sendResponse';
import { authRepository, passwordRepository } from '../../repositories/instances';
import { AuthService } from '../../services/auth.service';

const tokenManager: TokenManager = new TokenManager();
const authService = new AuthService();

export class AuthController extends SendResponse {

    private getScope(req: Request) {
        return { tenantId: (req as any).authData?.tenantId, requireTenant: true };
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

    checkEmail = (req: Request, res: Response, next: NextFunction) => {
        authRepository.findByEmail(req.params.email)
            .then((user: IAuth | any) => {
                if (!user || user === null) {
                    throw new Error('this email doesn\'t exist');
                }
                if (user && !user['activeState']) {
                    throw new Error('this account has been blocked');
                }

                return res.status(200).json({
                    userId: user._id,
                    message: 'Welcome....',
                    status: 200
                });
            })
            .catch((err: Error) => {

                return res.status(500).json({
                    message: 'check Email ' + err,
                    status: 500
                });
            });
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
            res.status(200).json({
                success: true,
                errors: [],
                status: 200,
                message: token,
                data: user
            });
        } catch (err) {
            next(err);
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
        let fetchedData: IAuth;
        authRepository.findByEmail(req.body.email)
            .then(async (user: IAuth | any) => {
                if (!user || user === null) {
                    throw new Error('email doesn\'t exist');
                }
                if (user && !user['activeState']) {
                    throw new Error('this account has been blocked');
                }

                fetchedData = user;
                let confirmedPassword = await compareLoginPassword(req, user._id, req.body.password);
                return await user ? confirmedPassword : new Error(`Login error message { statusCode: 404 }`);
            })
            .then(async (result: boolean | any) => {
                if (!result) {
                    throw new Error('password not matched');
                }
                let token = await tokenManager.generateToken({
                    _id: fetchedData._id.toString(),
                    email: fetchedData.email,
                    name: fetchedData.lastName + ' ' + fetchedData.firstName,
                    tenantId: fetchedData.tenantId?.toString?.() ?? fetchedData.tenantId,
                    role: fetchedData.role,
                    permission: fetchedData.permission,
                    permissions: fetchedData.permissions,
                    authType: fetchedData.authType
                });

                res.status(200).json({
                    status: 200,
                    message: token,
                    success: true,
                    errors: [],
                    data: fetchedData
                });
            })
            .catch((err: Error) => {
                return res.status(500).json({
                    message: `${err.message}`,
                    status: 500
                });
            });
    };

    getAll = (req: Request, res: Response, next: NextFunction) => {
        const pageSize = req.query.PageSize ? +req.query.PageSize : 10;
        const pageNo = req.query.PageNo ? +req.query.PageNo : 1;

        const filter = JSON.parse(req.query.filter as string);
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

    getById = (req: Request, res: Response, next: NextFunction) => {
        authRepository.findOne({ _id: req.params.authId }, this.getScope(req))
            .then((member: IAuth | any) => {
                if (member == null) {
                    throw new Error('user no data found { statusCode: 404 }');
                }

                return res.status(200).json({
                    member,
                    message: 'get member Info ::: DB',
                    status: 200
                });
            })
            .catch((err: Error) => {

                return res.status(500).json({
                    message: `err => ::: error catch ${err.message}`,
                    status: 500
                });
            });
    };

    deleteOne = (req: Request, res: Response, next: NextFunction) => {
        authRepository.deleteById(req.params.id, this.getScope(req))
            .then((admin: IAuth | any) => {
                res.status(200).json({
                    message: "deleted successfully",
                    Auth: admin,
                    status: 200
                });
            })
            .catch((err: Error) => {
                res.status(500).json({
                    message: err + ' auth ',
                    status: 500
                });
            });
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

