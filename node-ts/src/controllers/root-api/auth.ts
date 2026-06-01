import { Request, Response, NextFunction } from 'express';
import  Auth from '../../models/auth';
import Password from '../../models/password';
import { generateBcryptHash, compareBcryptHash, generateToken } from '../../util/jwtUtil';
import { IAuth } from '../../models/interfaces/auth.interface';
import { IPassword } from '../../models/interfaces/password.interface';
// import { SendResponse } from './base/sendResponse';
import { SendResponse } from '../base/sendResponse';

export class AuthController extends SendResponse{

    constructor() {
        super();
    }
    
    getAll = (req: Request, res: Response, next: NextFunction) => {
    
        const authQuery = Auth.find().sort({ createdAt: -1 });
        let fetchedList: IAuth[] = [];
   
        authQuery
            .then((documents: IAuth[]) => {
                fetchedList = documents;
                return Auth.countDocuments();
            })
            .then((count: number) => {
    
                // res.status(200).json({
                //     message: "members fetched successfully!",
                //     list: fetchedList,
                //     count: count,
                //     status: 200
                // });
                this.sendResponse(req, res, 200, fetchedList);
            })
            .catch((err: Error) => {
    
                res.status(500).json({
                    message: err + ' users fetched',
                    status: 500
                });
            });
    };
    
}

