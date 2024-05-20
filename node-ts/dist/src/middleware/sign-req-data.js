"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        if (req.headers && req.headers.authorization) {
            const token = req.headers.authorization.split(" ")[1];
            const decodedToken = jsonwebtoken_1.default.verify(token, 'secret_this_should_be_longer');
            req.authData = {
                email: decodedToken.email,
                id: decodedToken.userId,
                role: decodedToken.role,
                permeation: decodedToken.permeation
            };
        }
        else {
            // Handle the case where authorization header is missing
            res.status(401).json({ message: 'Authorization header missing' });
            return;
        }
        next();
    }
    catch (e) {
        res.status(401).json({
            message: 'middleware ::: ' + e
        });
    }
};
exports.default = authMiddleware;
