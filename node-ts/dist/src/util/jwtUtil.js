"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.compareBcryptHash = exports.generateBcryptHash = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generateToken = (userId, email, username, userRoles, permeation) => {
    const token = jsonwebtoken_1.default.sign({
        userId: userId,
        email: email,
        name: username,
        role: userRoles,
        permeation: permeation
    }, process.env.SECRET, { expiresIn: "3d" });
    return token;
};
exports.generateToken = generateToken;
const generateBcryptHash = async (password, salt) => {
    return await bcryptjs_1.default.hash(password, salt);
};
exports.generateBcryptHash = generateBcryptHash;
const compareBcryptHash = async (password, savedPassword) => {
    return await bcryptjs_1.default.compare(password, savedPassword);
};
exports.compareBcryptHash = compareBcryptHash;
const verifyToken = (roles) => {
    return async (req, res, next) => {
        try {
            const { token } = req.headers;
            console.log("token : " + token);
            if (!token) {
                console.log("No token exist");
                return res.status(500).send({ error: 'Token is not exist' });
            }
            // should validate if loggedIn user has the same role
            const decode = jsonwebtoken_1.default.verify(token, process.env.SECRET);
            console.log("decode:" + JSON.stringify(decode));
            req.user = {
                userId: decode.userId,
                username: decode.username,
                email: decode.email,
                fullname: decode.fullname,
                roles: decode.roles,
                userType: roles
            };
            console.log("roles : " + roles);
            if (!hasRole(roles, decode.roles)) {
                console.log("Error : not have the same role");
                return res.status(401).send({ error: 'Authentication failed' });
            }
            console.log("valid token");
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.verifyToken = verifyToken;
const hasRole = (routeRoles, userRoles) => {
    console.log("routeRoles : " + routeRoles);
    let result = false;
    userRoles.forEach(role => {
        if (routeRoles.map(r => r.userType).includes(role)) {
            result = true;
            return;
        }
    });
    console.log("result : " + result);
    return result;
};
