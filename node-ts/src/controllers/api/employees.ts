import { Request, Response, NextFunction } from 'express';
import Auth from '../../models/auth';
import Password from '../../models/password';
import { generateBcryptHash } from '../../util/jwtUtil';

export class EmployeesController{
    
    checkEmail = (req: Request, res: Response, next: NextFunction): void => {
        Auth.findOne({ email: req.params.email })
            .then((user: any) => {
    
                if (!user || user === null) { throw new Error('this email doesn\'t exist ') }
                if (user && !user['activeState'] ) { throw new Error('this account has been blocked ') }
    
                res.status(200).json({
                    userId: user._id,
                    message: 'Welcom....',
                    status: 200
                })
            })
            .catch((err: Error) => {
    
                res.status(500).json({
                    message: 'check Email' + err,
                    status: 500
                })
            })
    }
    
    updatePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    
        let bcryptHash =  await generateBcryptHash(req.body.password, 10);
    
        Password.updateOne({ userId: req.body.id }, {password: bcryptHash})
            .then((saved: any) => {
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
    }
    
    saveAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    
        let bcryptHash  = await generateBcryptHash(req.body.password, 10)
        const newAuth   = await new Auth(req.body);
        // newAuth['password'] = await bcryptHash;
        let password = await bcryptHash;
        newAuth.save()
            .then(async (saved: any) => {
    
                let savedPassword = await saveNewPassword(req, saved._id, password)
    
                if (!savedPassword) {
                    await Auth.deleteOne({ _id: saved._id })
                    throw new Error('new user not added !!!')
                }
                res.status(200)
                    .json({
                        success:  true,
                        errors:   [],
                        status:   200,
                        message:  'new employee added successfully',
                        data:     [saved]
                    })
            })
            .catch((err: Error) => {
                res.status(500).json({
                    message: `login error ->  ${ err.message }`,
                    status: 500,
                    success: true,
                    errors: [
                        `login error ->  ${ err.message }`
                    ],
                    data: []
                });
            })
    }
    
    updateOne  = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    
        try {
            // Update item by ID in database
            const updatedItem = await Auth.findByIdAndUpdate(
              req.params.id,
              req.body,
              { new: true }
            );
            if (!updatedItem) {
                res.status(404).json({ msg: 'Item not found' });
            }
            res.status(201)
                .json({
                success: true,
                errors: [],
                status: 200,
                message:  'updated successfully',
                data: [updatedItem]
            });
        } catch (err: any) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
    
    getAllItems = async (req: Request, res: Response): Promise<void> => {
        
        let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    
        let {ownerId, brancheId} = filter;
    
        const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
        const pageNo   = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1 ;
    
        try {
            console.log('filter', filter);
            console.log('brancheId', brancheId);
    
            // Fetch all items from database
        //   const items = await Auth.find({ brancheId, authType: "employee"}).sort({ createdAt: -1, activeState: 1 });
            const items = brancheId ? await Auth.find({ brancheId}).sort({ createdAt: -1, activeState: 1 }) : [];
            res.status(201)
            .json({
                success: true,
                errors: [],
                status: 200,
                message:  '',
                data: items
            });
        } catch (err: any) {
            console.error(err.message);
            res.status(500)
            .json({
                success: false,
                errors: [err.message],
                status: 500,
                message:  '',
                data: []
            });
        }
    };
    
    getById = (req: Request, res: Response, next: NextFunction): void => {
        Auth.findOne({ _id: req.params.authId })
            .then((member: any) => {
    
                if(member == null) {
                    throw new Error(' user no data found')
                }
                res.status(200).json({
                    member,
                    message: 'get member Info ::: DB',
                    status: 200
                })
            })
            .catch((err: Error) => {
                res.status(500).json({
                    message: `err => ::: error catch ${ err.message }`,
                    status: 500
                })
            })
    }
    
    deleteOne = (req: Request, res: Response, next: NextFunction): void => {
        Auth.deleteOne({ _id: req.params.id })
            .then((admin: any) => {
                res.status(200).json({
                    admin: admin,
                    message: 'delete admin Done ::: DB',
                    status: 200
                })
            })
            .catch((err: Error) => {
                res.status(500).json({
                    message: `err => ::: error catch  ${ err.message }`,
                    status: 500
                })
            })
    }

}

async function saveNewPassword(req: Request, userId: string, password: string): Promise<any> {

    try {
        let setPassword   = new Password({userId, password})    
        let savedPassword = await setPassword.save()
        return savedPassword
    } catch (err) {
        throw Error('error in saving password')
    }
}