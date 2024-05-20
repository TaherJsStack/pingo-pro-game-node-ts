const Auth         = require('../../models/auth')
const Password     = require('../../models/password')
const Logger       = require('../../services/logger.service');
const logger       = new Logger('auth.controller');
const auditService = require('../../audit/audit.service');
const { generateBcryptHash, compareBcryptHash, generateToken } = require('../../util/jwtUtil')

exports.checkEmail = (req, res, next) => {
    Auth.findOne({ email: req.params.email })
        .then(user => {

            // console.log('blocked ', user['activeState'])
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

exports.checkPassword = async (req, res, next) => {
    let { id, password } = await req.params;
    let confirmedPassword = await compareLoginPassword(req, id, password)
    if (!confirmedPassword) {
        logger.error(`${req.url}  | ${req.method}  | check password ` , confirmedPassword);
        auditService.prepareAudit(req, '', confirmedPassword);
        return res.status(200).json({
            //  message: 'this email doesn\'t exist',
            //  status: 500,
             val: confirmedPassword
        })
    } else {
        logger.error(` ${req.url}  | ${req.method}  | check password ` , confirmedPassword);
        auditService.prepareAudit(req, `check password ${ confirmedPassword }`, null);
        return res.status(200).json({
        //  message: 'Welcom....',
        //  status: 200,
            val: confirmedPassword
        })
    }
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
    // console.log('bcryptHash ----------------> ', bcryptHash)
    // console.log('bcryptHash ----------------> ', bcryptHash)


    newAuth.save()
        .then(async saved => {

            let savedPassword = await saveNewPassword(req, saved._id, password)
            // console.log('savedPassword ----------------> ', savedPassword)

            if (!savedPassword) {
                await Auth.deleteOne({ _id: saved._id })
                throw new Error('new user not added !!!')
            }

            // console.log('saved ----------------> ', saved)
            
            let token = await generateToken(
                saved._id, 
                saved.email, 
                saved.name, 
                saved.role,
                saved.permeation)
            let per = saved.permeation.reduce((a, c) => a + c)

            res.status(200)
                .json({
                    success:  true,
                    errors:   [],
                    status:   200,
                    message:  token,
                    data:     saved
                })
        })
        .catch(err => {
            logger.error(`${req.url}  | ${req.method}  | user  ` , err);
            auditService.prepareAudit(req, '', err);
            res.status(500).json({
                message: `login error ->  ${ err.message }`,
                status: 500,
                success: true,
                errors: [],
                data: { }
            });
        })
}

exports.updateOne  = (req, res, next) => {

    // let data = `${ req.params.id } | ${ req.body }`
    // console.log(data)

    Auth.updateOne({ _id: req.params.id }, req.body)
        .then((saved) => {

            logger.info(` ${req.url}  | ${req.method}  | update one Auth ` , req.body);
            auditService.prepareAudit(req, `update ${ saved }`, null);

            res.status(200).json({
                message: "updated successfully",
                Auth: saved,
                status: 200
            });
        })
        .catch(err => {

           logger.error(`${req.url}  | ${req.method}  | Failed to update one Auth ` , `${err}`);
            auditService.prepareAudit(req, '', `${ err }`);

            res.status(500).json({
                message: err + ' auth ',
                status: 500
            });
        });
}

exports.login = async (req, res, next) => {
    
    let fetchedData;
    Auth.findOne({ email: req.body.email })
        .then(async user => {
            if (!user || user === null) { throw new Error('this email doesn\'t exist ') }
            // console.log('blocked ', user['activeState'])
            if (user && !user['activeState'] ) { throw new Error('this account has been blocked ') }

            fetchedData = user;
            
            let confirmedPassword = await compareLoginPassword(req, user._id, req.body.password)
            
            return await user ? confirmedPassword : new Error(' Login error message', { statusCode: 404 })

        })
        .then(async result => {
            if (!result) {
                throw new Error('this password doesn\'t compare ')
            }
            let token = await generateToken(
                fetchedData._id, 
                fetchedData.email, 
                fetchedData.name, 
                fetchedData.role,
                fetchedData.permeation                
                )
            let per = fetchedData.permeation.reduce((a, c) => a + c)
 
            res.status(200)
                .json({
                    status:   200,
                    message:  token,
                    success:  true,
                    errors:   [],
                    data:     fetchedData
                })
        })
        .catch(err => {
           logger.error(`${req.url}  | ${req.method}  | user  ` , err.message);
            auditService.prepareAudit(req, '', err.message);
            return res.status(500).json({
                message: `login error -> + ${ err.message }`,
                status: 500
            })
        })
}

exports.getAll = (req, res, next) => {

    const pageSize  = +req.query.PageSize;
    const pageNo    = +req.query.PageNo > 0 ? req.query.PageNo : 1 ;

    const filter = JSON.parse(req.query.filter)
    const listType = req.query.listType

    // console.log('listType ---------->', req.query.listType)
    // console.log('filter ---------->', filter)

    const role = filter['role']

    // return
    const authQuery = Auth.find(filter).sort({createdAt: -1});
    let fetchedList;
    if (pageSize && pageNo) {
        authQuery.skip(pageSize * (pageNo - 1)).limit(pageSize);
    }
    authQuery
        .then(documents => {
            fetchedList = documents;
            return Auth.countDocuments();
        })
        .then(count => {

            logger.info(` ${req.url}  | ${req.method}  | user fetched List ` , fetchedList);
            auditService.prepareAudit(req, `fetched users ${ fetchedList }`, null);

            if (listType && listType === 'team') {
                fetchedList = fetchedList.filter(user => user.role !== 3)
            }

            res.status(200).json({
                message: "members fetched successfully!",
                list:   fetchedList,
                count:  count,
                status: 200
            });
        })
        .catch(err => {
            
           logger.error(`${req.url}  | ${req.method}  | users  ` , err);
            auditService.prepareAudit(req, '', err);

            res.status(500).json({
                message: err + ' users fetched',
                status: 500
            });
        });
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

async function compareLoginPassword(req, userId, password) {
    try {

        let passwordBcryptHash = await Password.findOne({userId});

        return await compareBcryptHash(password, passwordBcryptHash['password'])

    } catch (err) {
        logger.error(`${req.url}  | ${req.method}  | user  ` , err);
        auditService.prepareAudit(req, '', err);
    }
}
