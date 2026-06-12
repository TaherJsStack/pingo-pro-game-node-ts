import { Request, Response } from 'express';
import Auth from '../../models/auth';
import { IAuth } from '../../models/interfaces/auth.interface';
import { SendResponse } from '../base/sendResponse';

export class AuthController extends SendResponse{

    constructor() {
        super();
    }
    
    getAll = async (req: Request, res: Response): Promise<void> => {
        try {
            const pageNo = Math.max(Number(req.query.PageNo ?? 1), 1);
            const pageSize = Math.max(Number(req.query.PageSize ?? 10), 1);
            const skip = (pageNo - 1) * pageSize;

            const [fetchedList, totalData] = await Promise.all([
                Auth.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
                Auth.countDocuments(),
            ]);

            this.sendResponse(req, res, 200, fetchedList as IAuth[], totalData);
        } catch (err: any) {
            this.sendErrorResponse(req, res, err);
        }
    };
    
}

