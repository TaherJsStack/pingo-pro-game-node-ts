const Auth         = require('../../models/auth')
const Invoice      = require('../../models/invoice')
const Password     = require('../../models/password')
const Logger       = require('../../services/logger.service');
const logger       = new Logger('auth.controller');
const auditService = require('../../audit/audit.service');
const { generateBcryptHash } = require('../../util/jwtUtil')
const { ObjectId } = require('mongoose').Types;

exports.checkEmail = (req, res, next) => {
    Auth.findOne({ email: req.params.email })
        .then(user => {

            if (!user || user === null) { throw new Error('this email doesn\'t exist ') }
            if (user && !user['activeState'] ) { throw new Error('this account has been blocked ') }

            logger.info(` ${req.url}  | ${req.method}  | check Email ` , user);
            auditService.prepareAudit(req, `check Email ${ user }`, null);

            return res.status(200).json({
                userId: user._id,
                message: 'Welcom....',
                status: 200
            })
        })
        .catch(err => {

            logger.error(`${req.url}  | ${req.method}  | check Email ` , err);
            auditService.prepareAudit(req, '', err);

            return res.status(500).json({
                message: 'check Email' + err,
                status: 500
            })
        })
}

exports.updatePassword = async (req, res, next) => {

    let bcryptHash =  await generateBcryptHash(req.body.password, 10);

    Password.updateOne({ userId: req.body.id }, {password: bcryptHash})
        .then((saved) => {
            logger.info(` ${req.url}  | ${req.method}  | update password  ` , req.body);
            auditService.prepareAudit(req, `update password ${ saved }`, null);
            res.status(200).json({
                message: "updated password successfully",
                status: 200
            });
        })
        .catch(err => {
           logger.error(`${req.url}  | ${req.method}  | Failed to update password ` , `${err}`);
            auditService.prepareAudit(req, '', `${ err }`);
            res.status(500).json({
                message: err + ' update password ',
                status: 500
            });
        });
}

exports.saveAuth = async (req, res, next) => {

    let bcryptHash  = await generateBcryptHash(req.body.password, 10)
    const newAuth   = await new Auth(req.body);
    // newAuth['password'] = await bcryptHash;
    let password = await bcryptHash;
    newAuth.save()
        .then(async saved => {

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
        .catch(err => {
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

exports.updateOne  = async (req, res, next) => {

    try {
        // Update item by ID in database
        const updatedItem = await Auth.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );
        if (!updatedItem) {
          return res.status(404).json({ msg: 'Item not found' });
        }
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message:  'updated successfully',
            data: [updatedItem]
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

exports.getAllItems = async (req, res) => {
    

    let filter = JSON.parse(req.query.Filter);

    let {ownerId, brancheId} = filter;

    const pageSize = +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo   = +req.query.PageNo > 0 ? req.query.PageNo : 1 ;

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
    } catch (err) {
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

exports.getById = (req, res, next) => {
    Auth.findOne({ _id: req.params.authId })
        .then(member => {

            if(member == null) {
                throw new Error(' user no data found ', { statusCode: 404 })
            }

            logger.info(` ${req.url}  | ${req.method}  | user ` , member);
            auditService.prepareAudit(req, `get user ${ member }`, null);

            return res.status(200).json({
                member,
                message: 'get member Info ::: DB',
                status: 200
            })
        })
        .catch(err => {

           logger.error(`${req.url}  | ${req.method}  | user  ` , err);
            auditService.prepareAudit(req, '', err);

            return res.status(500).json({
                message: `err => ::: error catch ${ err.message }`,
                status: 500
            })
        })
}

exports.delete = (req, res, next) => {
    Auth.deleteOne({ _id: req.params.id })
        .then(admin => {

            logger.info(` ${req.url}  | ${req.method}  | user ` , admin);
            auditService.prepareAudit(req, `delete ${ admin }`, null);

            return res.status(200).json({
                admin: admin,
                message: 'delete admin Done ::: DB',
                status: 200
            })
        })
        .catch(err => {
            
           logger.error(`${req.url}  | ${req.method}  | user  ` , err);
            auditService.prepareAudit(req, '', err);

            return res.status(500).json({
                message: `err => ::: error catch  ${ err.message }`,
                status: 500
            })
        })
}

async function saveNewPassword(req, userId, password) {

    try {
        let setPassword   = new Password({userId, password})    
        let savedPassword = await setPassword.save()
        return savedPassword
    } catch (err) {
        logger.error(`${req.url}  | ${req.method}  | user  ` , err);
        auditService.prepareAudit(req, '', err);
    }
}

