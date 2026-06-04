import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

interface CustomRequest extends Request {
    authData?: {
        id:           string;
        role:         string;
        email:        string;
        permission:   string;
        authType?:    string;
        permissions?: any;
    };
  }

const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        if (req.headers && req.headers.authorization) {
            const token: string = req.headers.authorization.split(" ")[1];
            const decodedToken: any = jwt.verify(token, env.secret);
            // console.log('decodedToken -->', decodedToken);
            req.authData = {
                id:          decodedToken._id,
                role:        decodedToken.role,
                email:       decodedToken.email,
                permission:  decodedToken.permission,
                authType:    decodedToken.authType,
                permissions: decodedToken.permissions,
            }
        } else {
            // Handle the case where authorization header is missing
            res.status(401).json({ message: 'Authorization header missing' });
            return;
        }
        next();
    } catch (e) {
        res.status(401).json({
            message: 'middleware ::: '+ e
        })
    }
}

export default authMiddleware;
