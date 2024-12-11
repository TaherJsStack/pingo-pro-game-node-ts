import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface CustomRequest extends Request {
    authData?: {
        id:           string;
        role:         string;
        email:        string;
        permeation:   string;
    };
  }

const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        if (req.headers && req.headers.authorization) {
            const token: string = req.headers.authorization.split(" ")[1];
            const decodedToken: any = jwt.verify(token, 'secret_this_should_be_longer');
            req.authData = { 
                id:         decodedToken.userId, 
                role:       decodedToken.role,
                email:      decodedToken.email, 
                permeation: decodedToken.permeation 
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