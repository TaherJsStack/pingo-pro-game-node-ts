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
exports.deleteOne = exports.getById = exports.getAllItems = exports.updateOne = exports.saveAuth = exports.updatePassword = exports.checkEmail = void 0;
const auth_1 = __importDefault(require("../../models/auth"));
const password_1 = __importDefault(require("../../models/password"));
const jwtUtil_1 = require("../../util/jwtUtil");
const checkEmail = (req, res, next) => {
    auth_1.default.findOne({ email: req.params.email })
        .then((user) => {
        if (!user || user === null) {
            throw new Error('this email doesn\'t exist ');
        }
        if (user && !user['activeState']) {
            throw new Error('this account has been blocked ');
        }
        res.status(200).json({
            userId: user._id,
            message: 'Welcom....',
            status: 200
        });
    })
        .catch((err) => {
        res.status(500).json({
            message: 'check Email' + err,
            status: 500
        });
    });
};
exports.checkEmail = checkEmail;
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
    const newAuth = yield new auth_1.default(req.body);
    // newAuth['password'] = await bcryptHash;
    let password = yield bcryptHash;
    newAuth.save()
        .then((saved) => __awaiter(void 0, void 0, void 0, function* () {
        let savedPassword = yield saveNewPassword(req, saved._id, password);
        if (!savedPassword) {
            yield auth_1.default.deleteOne({ _id: saved._id });
            throw new Error('new user not added !!!');
        }
        res.status(200)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: 'new employee added successfully',
            data: [saved]
        });
    }))
        .catch((err) => {
        res.status(500).json({
            message: `login error ->  ${err.message}`,
            status: 500,
            success: true,
            errors: [
                `login error ->  ${err.message}`
            ],
            data: []
        });
    });
});
exports.saveAuth = saveAuth;
const updateOne = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Update item by ID in database
        const updatedItem = yield auth_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedItem) {
            res.status(404).json({ msg: 'Item not found' });
        }
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: 'updated successfully',
            data: [updatedItem]
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
exports.updateOne = updateOne;
const getAllItems = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let filter = typeof req.query.Filter === 'string' ? JSON.parse(req.query.Filter) : {};
    let { ownerId, brancheId } = filter;
    const pageSize = req.query.PageSize && +req.query.PageSize > 0 ? req.query.PageSize : 15;
    const pageNo = req.query.PageNo && +req.query.PageNo > 0 ? req.query.PageNo : 1;
    try {
        console.log('filter', filter);
        console.log('brancheId', brancheId);
        // Fetch all items from database
        //   const items = await Auth.find({ brancheId, authType: "employee"}).sort({ createdAt: -1, activeState: 1 });
        const items = brancheId ? yield auth_1.default.find({ brancheId }).sort({ createdAt: -1, activeState: 1 }) : [];
        res.status(201)
            .json({
            success: true,
            errors: [],
            status: 200,
            message: '',
            data: items
        });
    }
    catch (err) {
        console.error(err.message);
        res.status(500)
            .json({
            success: false,
            errors: [err.message],
            status: 500,
            message: '',
            data: []
        });
    }
});
exports.getAllItems = getAllItems;
const getById = (req, res, next) => {
    auth_1.default.findOne({ _id: req.params.authId })
        .then((member) => {
        if (member == null) {
            throw new Error(' user no data found');
        }
        res.status(200).json({
            member,
            message: 'get member Info ::: DB',
            status: 200
        });
    })
        .catch((err) => {
        res.status(500).json({
            message: `err => ::: error catch ${err.message}`,
            status: 500
        });
    });
};
exports.getById = getById;
const deleteOne = (req, res, next) => {
    auth_1.default.deleteOne({ _id: req.params.id })
        .then((admin) => {
        res.status(200).json({
            admin: admin,
            message: 'delete admin Done ::: DB',
            status: 200
        });
    })
        .catch((err) => {
        res.status(500).json({
            message: `err => ::: error catch  ${err.message}`,
            status: 500
        });
    });
};
exports.deleteOne = deleteOne;
function saveNewPassword(req, userId, password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let setPassword = new password_1.default({ userId, password });
            let savedPassword = yield setPassword.save();
            return savedPassword;
        }
        catch (err) {
            throw Error('error in saving password');
        }
    });
}
