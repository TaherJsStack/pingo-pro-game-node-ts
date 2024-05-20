"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteOne = exports.getById = exports.getAll = exports.login = exports.updateOne = exports.saveAuth = exports.updatePassword = exports.checkPassword = exports.checkEmail = void 0;
const auth_1 = __importDefault(require("../../models/auth"));
const password_1 = __importDefault(require("../../models/password"));
const jwtUtil_1 = require("../../util/jwtUtil");
const checkEmail = (req, res, next) => {
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
exports.checkEmail = checkEmail;
const checkPassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let { id, password } = req.params;
    let confirmedPassword = yield compareLoginPassword(req, id, password);
    if (!confirmedPassword) {
        return res.status(200).json({
            val: confirmedPassword
        });
    }
    else {
        return res.status(200).json({
            val: confirmedPassword
        });
    }
});
exports.checkPassword = checkPassword;
const updatePassword = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let bcryptHash = yield (0, jwtUtil_1.generateBcryptHash)(req.body.password, 10);
    password_1.default.updateOne({ userId: req.body.id }, { password: bcryptHash })
        .then((saved) => {
        res.status(200).json({
            message: "updated password successfully",
            status: 200
        });
    })
        .catch((err) => {
        res.status(500).json({
            message: err + ' update password ',
            status: 500
        });
    });
});
exports.updatePassword = updatePassword;
const saveAuth = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let bcryptHash = yield (0, jwtUtil_1.generateBcryptHash)(req.body.password, 10);
    const newAuth = new auth_1.default(req.body);
    let password = bcryptHash;
    newAuth.save()
        .then((saved) => __awaiter(void 0, void 0, void 0, function* () {
        let savedPassword = yield saveNewPassword(req, saved._id.toString(), password);
        if (!savedPassword) {
            yield auth_1.default.deleteOne({ _id: saved._id });
            throw new Error('new user not added !!!');
        }
        let token = yield (0, jwtUtil_1.generateToken)(saved._id.toString(), saved.email, saved.lastName + ' ' + saved.firstName, saved.role, saved.permeation);
        res.status(200).json({
            success: true,
            errors: [],
            status: 200,
            message: token,
            data: saved
        });
    }))
        .catch((err) => {
        res.status(500).json({
            message: `login error ->  ${err.message}`,
            status: 500,
            success: true,
            errors: [],
            data: {}
        });
    });
});
exports.saveAuth = saveAuth;
const updateOne = (req, res, next) => {
    auth_1.default.updateOne({ _id: req.params.id }, req.body)
        .then((saved) => {
        res.status(200).json({
            message: "updated successfully",
            Auth: saved,
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
exports.updateOne = updateOne;
const login = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let fetchedData;
    auth_1.default.findOne({ email: req.body.email })
        .then((user) => __awaiter(void 0, void 0, void 0, function* () {
        if (!user || user === null) {
            throw new Error('this email doesn\'t exist');
        }
        if (user && !user['activeState']) {
            throw new Error('this account has been blocked');
        }
        fetchedData = user;
        let confirmedPassword = yield compareLoginPassword(req, user._id, req.body.password);
        return (yield user) ? confirmedPassword : new Error(`Login error message { statusCode: 404 }`);
    }))
        .then((result) => __awaiter(void 0, void 0, void 0, function* () {
        if (!result) {
            throw new Error('this password doesn\'t compare');
        }
        let token = yield (0, jwtUtil_1.generateToken)(fetchedData._id.toString(), fetchedData.email, fetchedData.firstName + ' ' + fetchedData.lastName, fetchedData.role, fetchedData.permeation);
        res.status(200).json({
            status: 200,
            message: token,
            success: true,
            errors: [],
            data: fetchedData
        });
    }))
        .catch((err) => {
        return res.status(500).json({
            message: `login error -> + ${err.message}`,
            status: 500
        });
    });
});
exports.login = login;
const getAll = (req, res, next) => {
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
exports.getAll = getAll;
const getById = (req, res, next) => {
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
exports.getById = getById;
const deleteOne = (req, res, next) => {
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
exports.deleteOne = deleteOne;
function compareLoginPassword(req, userId, userPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let userData = yield password_1.default.findOne({ userId });
            console.log('user --> ', userData.password);
            if (!userData) {
                throw new Error('no password to compare');
            }
            return yield (0, jwtUtil_1.compareBcryptHash)(userPassword, userData.password);
        }
        catch (error) {
            console.log(error);
        }
    });
}
function saveNewPassword(req, id, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const newPassword = new password_1.default({ userId: id, password: password });
        let savedPassword = false;
        yield newPassword.save()
            .then((saved) => {
            savedPassword = true;
        })
            .catch((err) => {
            savedPassword = false;
        });
        return savedPassword;
    });
}
