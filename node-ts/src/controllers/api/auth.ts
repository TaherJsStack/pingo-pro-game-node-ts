import { TokenManager } from './token-manager';
import { Request, Response, NextFunction } from 'express';
import  Auth from '../../models/auth';
import Password from '../../models/password';
import { generateBcryptHash, compareBcryptHash, generateToken } from '../../util/jwtUtil';
import { IAuth } from '../../models/interfaces/auth.interface';
import { IPassword } from '../../models/interfaces/password.interface';
// import { SendResponse } from './base/sendResponse';
import { AddressController } from './address';
import { InboxController } from './inbox';
import { SendResponse } from '../base/sendResponse';

const createAddress: AddressController  = new AddressController();
const inbox:         InboxController    = new InboxController();
const tokenManager:  TokenManager       = new TokenManager();


export class AuthController extends SendResponse{
    
    checkPhone = async (req: Request, res: Response, next: NextFunction) => {
        // console.log('checkPhone req.params ---> ', req.params)
        try {
            let user: (IAuth | any )= await Auth.findOne({ phone: req.params.phone })
            if (user && user['activeState']) {                
                // console.log('checkPhone user ---> ', user)
                this.sendResponse(req, res, 201, [user]);
            } 
            else {
                this.sendResponse(req,res, 201, []);
                // throw new Error('this phone doesn\'t exist or this account has been blocked');
            }
          } catch (err: any) {
            // console.log('catch checkPhone user ---> ', err)

            this.sendErrorResponse(req, res, err);
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
        let { id } = req.params;
        let { password } = req.body;
        let confirmedPassword = await compareLoginPassword(req, id, password);
        if (!confirmedPassword) {
            this.sendErrorResponse(req, res, 'password not matched');
        } else {
            this.sendResponse(req,res, 200, confirmedPassword);
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
            let saved = await Password.updateOne({ userId: id }, { password: bcryptHash })
            this.sendResponse(req,res, 200, saved);
        } catch (error) {
            this.sendErrorResponse(req, res, error);
        }

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
    
                await createAddress.createItemAuthAddress( res, saved as IAuth)

                // let token = await generateToken(
                //     saved._id.toString(),
                //     saved.email,
                //     saved.lastName + ' ' + saved.firstName,
                //     saved.role,
                //     saved.permeation
                // );

                let token = await tokenManager.generateToken({ 
                    _id:        saved._id.toString(), 
                    email:      saved.email,
                    name:       saved.lastName + ' ' + saved.firstName,
                    role:       saved.role, 
                    permeation: saved.permeation
                });

                await inbox.sendWelcomMessage(saved._id.toString())
    
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
        // console.log('Auth updateOne', req.body);
        try {
            const updatedItem = await Auth.findByIdAndUpdate(req.params.id, req.body, { new: true });
            if (!updatedItem) {
             res.status(404).json({ msg: 'Item not found' });
            }
            this.sendResponse(req,res, 200, [updatedItem]);
          } catch (err: any) {
            this.sendErrorResponse(req, res, err);
          }
    };
    
    refreshToken = async (req: Request, res: Response, next: NextFunction) => {
        let { refreshToken } = req.body;
        let token = await tokenManager.refreshToken(refreshToken);
        this.sendResponse(req,res, 200, [token]);
    }

    login = async (req: Request, res: Response, next: NextFunction) => {
        let fetchedData: IAuth;
        Auth.findOne({ email: req.body.email })
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
                // let token = await generateToken(
                //     fetchedData._id.toString(),
                //     fetchedData.email,
                //     fetchedData.firstName + ' ' + fetchedData.lastName,
                //     fetchedData.role,
                //     fetchedData.permeation
                // );
                let token = await tokenManager.generateToken({ 
                    _id:         fetchedData._id.toString(), 
                    email:       fetchedData.email,
                    name:        fetchedData.lastName + ' ' + fetchedData.firstName,
                    role:        fetchedData.role, 
                    // permeation:  fetchedData.permeation,
                    permeations: fetchedData.permissions,
                    authType:    fetchedData.authType
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
        let savedUserPassword: IPassword = await Password.findOne<IPassword>({userId}) as IPassword;
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
