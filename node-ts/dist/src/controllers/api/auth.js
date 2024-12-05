"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const token_manager_1 = require("./token-manager");
const auth_1 = __importDefault(require("../../models/auth"));
const password_1 = __importDefault(require("../../models/password"));
const jwtUtil_1 = require("../../util/jwtUtil");
// import { SendResponse } from './base/sendResponse';
const address_1 = require("./address");
const inbox_1 = require("./inbox");
const sendResponse_1 = require("../base/sendResponse");
const createAddress = new address_1.AddressController();
const inbox = new inbox_1.InboxController();
const tokenManager = new token_manager_1.TokenManager();
class AuthController extends sendResponse_1.SendResponse {
    constructor() {
        super(...arguments);
        this.checkPhone = async (req, res, next) => {
            // console.log('checkPhone req.params ---> ', req.params)
            try {
                let user = await auth_1.default.findOne({ phone: req.params.phone });
                if (user && user['activeState']) {
                    // console.log('checkPhone user ---> ', user)
                    this.sendResponse(req, res, 201, [user]);
                }
                else {
                    this.sendResponse(req, res, 201, []);
                    // throw new Error('this phone doesn\'t exist or this account has been blocked');
                }
            }
            catch (err) {
                // console.log('catch checkPhone user ---> ', err)
                this.sendErrorResponse(req, res, err);
            }
        };
        this.checkEmail = (req, res, next) => {
            auth_1.default.findOne({ email: req.params.email })
                .then((user) => {
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
                .catch((err) => {
                return res.status(500).json({
                    message: 'check Email ' + err,
                    status: 500
                });
            });
        };
        this.checkPassword = async (req, res, next) => {
            let { id } = req.params;
            let { password } = req.body;
            let confirmedPassword = await compareLoginPassword(req, id, password);
            if (!confirmedPassword) {
                this.sendErrorResponse(req, res, 'password not matched');
            }
            else {
                this.sendResponse(req, res, 200, confirmedPassword);
            }
        };
        this.updatePassword = async (req, res, next) => {
            // let { id, password } = req.params;
            let { id, password, oldPassword, confirmPassword } = req.body;
            let confirmedPassword = await compareLoginPassword(req, id, oldPassword);
            //console.log('confirmedPassword --->', confirmedPassword)
            if (!confirmedPassword) {
                this.sendErrorResponse(req, res, 'password not matched');
                return;
            }
            try {
                let bcryptHash = await (0, jwtUtil_1.generateBcryptHash)(password, 10);
                let saved = await password_1.default.updateOne({ userId: id }, { password: bcryptHash });
                this.sendResponse(req, res, 200, saved);
            }
            catch (error) {
                this.sendErrorResponse(req, res, error);
            }
        };
        this.saveAuth = async (req, res, next) => {
            let bcryptHash = await (0, jwtUtil_1.generateBcryptHash)(req.body.password, 10);
            const newAuth = new auth_1.default(req.body);
            let password = bcryptHash;
            newAuth.save()
                .then(async (saved) => {
                let savedPassword = await saveNewPassword(req, saved._id.toString(), password);
                if (!savedPassword) {
                    await auth_1.default.deleteOne({ _id: saved._id });
                    throw new Error('new user not added !!!');
                }
                await createAddress.createItemAuthAddress(res, saved);
                // let token = await generateToken(
                //     saved._id.toString(),
                //     saved.email,
                //     saved.lastName + ' ' + saved.firstName,
                //     saved.role,
                //     saved.permeation
                // );
                let token = await tokenManager.generateToken({
                    _id: saved._id.toString(),
                    email: saved.email,
                    name: saved.lastName + ' ' + saved.firstName,
                    role: saved.role,
                    permeation: saved.permeation
                });
                await inbox.sendWelcomMessage(saved._id.toString());
                res.status(200).json({
                    success: true,
                    errors: [],
                    status: 200,
                    message: token,
                    data: saved
                });
            })
                .catch((err) => {
                res.status(500).json({
                    message: `login error ->  ${err.message}`,
                    status: 500,
                    success: true,
                    errors: [],
                    data: {}
                });
            });
        };
        this.updateOne = async (req, res, next) => {
            // console.log('Auth updateOne', req.body);
            try {
                const updatedItem = await auth_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
                if (!updatedItem) {
                    res.status(404).json({ msg: 'Item not found' });
                }
                this.sendResponse(req, res, 200, [updatedItem]);
            }
            catch (err) {
                this.sendErrorResponse(req, res, err);
            }
        };
        this.refreshToken = async (req, res, next) => {
            let { refreshToken } = req.body;
            let token = await tokenManager.refreshToken(refreshToken);
            this.sendResponse(req, res, 200, [token]);
        };
        this.login = async (req, res, next) => {
            let fetchedData;
            auth_1.default.findOne({ email: req.body.email })
                .then(async (user) => {
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
                .then(async (result) => {
                if (!result) {
                    throw new Error('this password doesn\'t compare');
                }
                // let token = await generateToken(
                //     fetchedData._id.toString(),
                //     fetchedData.email,
                //     fetchedData.firstName + ' ' + fetchedData.lastName,
                //     fetchedData.role,
                //     fetchedData.permeation
                // );
                let token = await tokenManager.generateToken({
                    _id: fetchedData._id.toString(),
                    email: fetchedData.email,
                    name: fetchedData.lastName + ' ' + fetchedData.firstName,
                    role: fetchedData.role,
                    permeation: fetchedData.permeation
                });
                res.status(200).json({
                    status: 200,
                    message: token,
                    success: true,
                    errors: [],
                    data: fetchedData
                });
            })
                .catch((err) => {
                return res.status(500).json({
                    message: `login error -> + ${err.message}`,
                    status: 500
                });
            });
        };
        this.getAll = (req, res, next) => {
            const pageSize = req.query.PageSize ? +req.query.PageSize : 10;
            const pageNo = req.query.PageNo ? +req.query.PageNo : 1;
            const filter = JSON.parse(req.query.filter);
            const listType = req.query.listType;
            const authQuery = auth_1.default.find(filter).sort({ createdAt: -1 });
            let fetchedList = [];
            if (pageSize && pageNo) {
                authQuery.skip(pageSize * (pageNo - 1)).limit(pageSize);
            }
            authQuery
                .then((documents) => {
                fetchedList = documents;
                return auth_1.default.countDocuments();
            })
                .then((count) => {
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
                .catch((err) => {
                res.status(500).json({
                    message: err + ' users fetched',
                    status: 500
                });
            });
        };
        this.getById = (req, res, next) => {
            auth_1.default.findOne({ _id: req.params.authId })
                .then((member) => {
                if (member == null) {
                    throw new Error('user no data found { statusCode: 404 }');
                }
                return res.status(200).json({
                    member,
                    message: 'get member Info ::: DB',
                    status: 200
                });
            })
                .catch((err) => {
                return res.status(500).json({
                    message: `err => ::: error catch ${err.message}`,
                    status: 500
                });
            });
        };
        this.deleteOne = (req, res, next) => {
            auth_1.default.findOneAndDelete({ _id: req.params.id })
                .then((admin) => {
                res.status(200).json({
                    message: "deleted successfully",
                    Auth: admin,
                    status: 200
                });
            })
                .catch((err) => {
                res.status(500).json({
                    message: err + ' auth ',
                    status: 500
                });
            });
        };
    }
}
exports.AuthController = AuthController;
async function compareLoginPassword(req, userId, userPassword) {
    try {
        let savedUserPassword = await password_1.default.findOne({ userId });
        // console.log('user --> ', userData.password);
        if (!savedUserPassword) {
            throw new Error('no password to compare');
        }
        // let confirmedPassword = await tokenManager.verifyToken(token);
        return await (0, jwtUtil_1.compareBcryptHash)(userPassword, savedUserPassword.password);
    }
    catch (error) {
        console.log('compareLoginPassword -->', error);
    }
}
async function saveNewPassword(req, id, password) {
    const newPassword = new password_1.default({ userId: id, password: password });
    let savedPassword = false;
    await newPassword.save()
        .then((saved) => {
        savedPassword = true;
    })
        .catch((err) => {
        savedPassword = false;
    });
    return savedPassword;
}
