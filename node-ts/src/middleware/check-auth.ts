import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface CustomRequest extends Request {
    authData?: {
      email: string;
      id: string;
      role: string;
      permeation: string;
    };
  }

const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (authorizationHeader) {
            const token: string = authorizationHeader.split(" ")[1];
            const decodedToken: any = jwt.verify(token, 'secret_this_should_be_longer');
            req.authData = { 
                email: decodedToken.email, 
                id: decodedToken.userId, 
                role: decodedToken.role,
                permeation: decodedToken.permeation 
            }
            next();
        } else {
            res.status(401).json({
                message: 'Authorization header is missing'
            });
        }
    } catch (e) {
        res.status(401).json({
            message: 'middleware ::: '+ e
        })
    }
}

export default authMiddleware;