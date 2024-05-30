import { Request, Response, NextFunction } from 'express';
import  Auth from '../../models/auth';
import Password from '../../models/password';
import { generateBcryptHash, compareBcryptHash, generateToken } from '../../util/jwtUtil';
import { IAuth } from '../../models/interfaces/auth.interface';
import { IPassword } from '../../models/interfaces/password.interface';
import { SendResponse } from './base/sendResponse';

export class AuthController extends SendResponse{
    
    checkPhone = async (req: Request, res: Response, next: NextFunction) => {
        console.log('checkPhone req.params ---> ', req.params)
        try {
            let user: (IAuth | any )= await Auth.findOne({ phone: req.params.phone })
            console.log('checkPhone user ---> ', user)
            this.sendResponse(res, 201, [user]);
          } catch (err: any) {
            console.log('catch checkPhone user ---> ', err)

            this.sendErrorResponse(res, err);
          }

    };
    

    checkEmail = (req: Request, res: Response, next: NextFunction) => {
        Auth.findOne({ email: req.params.email })
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
        let { id, password } = req.params;
        let confirmedPassword = await compareLoginPassword(req, id, password);
        if (!confirmedPassword) {
    
            return res.status(200).json({
                val: confirmedPassword
            });
        } else {
            return res.status(200).json({
                val: confirmedPassword
            });
        }
    };
    
    updatePassword = async (req: Request, res: Response, next: NextFunction) => {
        let bcryptHash = await generateBcryptHash(req.body.password, 10);
    
        Password.updateOne({ userId: req.body.id }, { password: bcryptHash })
            .then((saved: IAuth | any) => {
                res.status(200).json({
                    message: "updated password successfully",
                    status: 200
                });
            })
            .catch((err: Error) => {
                res.status(500).json({
                    message: err + ' update password ',
                    status: 500
                });
            });
    };
    
    saveAuth = async (req: Request, res: Response, next: NextFunction) => {
        let bcryptHash = await generateBcryptHash(req.body.password, 10);
        const newAuth = new Auth(req.body);
        let password = bcryptHash;
    
        newAuth.save()
            .then(async (saved: IAuth) => {
                let savedPassword = await saveNewPassword(req, saved._id.toString(), password);
    
                if (!savedPassword) {
                    await Auth.deleteOne({ _id: saved._id });
                    throw new Error('new user not added !!!');
                }
    
                let token = await generateToken(
                    saved._id.toString(),
                    saved.email,
                    saved.lastName + ' ' + saved.firstName,
                    saved.role,
                    saved.permeation
                );
    
                res.status(200).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: token,
                    data: saved
                });
            })
            .catch((err: Error) => {
                res.status(500).json({
                    message: `login error ->  ${err.message}`,
                    status: 500,
                    success: true,
                    errors: [],
                    data: {}
                });
            });
    };
    
    updateOne = async (req: Request, res: Response, next: NextFunction) => {
        console.log('Auth updateOne', req.body);
        try {
            const updatedItem = await Auth.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedItem) {
             res.status(404).json({ msg: 'Item not found' });
            }
            this.sendResponse(res, 200, [updatedItem]);
          } catch (err: any) {
            this.sendErrorResponse(res, err);
          }
    };
    
    login = async (req: Request, res: Response, next: NextFunction) => {
        let fetchedData: IAuth;
        Auth.findOne({ email: req.body.email })
            .then(async (user: IAuth | any) => {
                if (!user || user === null) {
                    throw new Error('this email doesn\'t exist');
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
                    throw new Error('this password doesn\'t compare');
                }
                let token = await generateToken(
                    fetchedData._id.toString(),
                    fetchedData.email,
                    fetchedData.firstName + ' ' + fetchedData.lastName,
                    fetchedData.role,
                    fetchedData.permeation
                );
    
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
                    message: `login error -> + ${err.message}`,
                    status: 500
                });
            });
    };
    
    getAll = (req: Request, res: Response, next: NextFunction) => {
        const pageSize = req.query.PageSize ? +req.query.PageSize : 10;
        const pageNo = req.query.PageNo ? +req.query.PageNo : 1;
    
        const filter = JSON.parse(req.query.filter as string);
        const listType = req.query.listType as string;
    
        const authQuery = Auth.find(filter).sort({ createdAt: -1 });
        let fetchedList: IAuth[] = [];
        if (pageSize && pageNo) {
            authQuery.skip(pageSize * (pageNo - 1)).limit(pageSize);
        }
        authQuery
            .then((documents: IAuth[]) => {
                fetchedList = documents;
                return Auth.countDocuments();
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
        Auth.findOne({ _id: req.params.authId })
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
        Auth.findOneAndDelete({ _id: req.params.id })
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
        let userData: IPassword = await Password.findOne<IPassword>({userId}) as IPassword;
            // console.log('user --> ', userData.password);
            if (!userData) {
                throw new Error('no password to compare');
            }
            return await compareBcryptHash(userPassword, userData.password);
        
    } catch (error) {
        // console.log('compareLoginPassword -->', error);
    }
}

async function saveNewPassword(req: Request, id: string, password: string) {
    const newPassword = new Password({ userId: id, password: password });

    let savedPassword = false;
    await newPassword.save()
        .then((saved: IAuth | any) => {
           
            savedPassword = true;
        })
        .catch((err: Error) => {
            savedPassword = false;
        });

    return savedPassword;
}
