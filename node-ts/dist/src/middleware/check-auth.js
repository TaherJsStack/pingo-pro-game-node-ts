"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (authorizationHeader) {
            const token = authorizationHeader.split(" ")[1];
            const decodedToken = jsonwebtoken_1.default.verify(token, 'secret_this_should_be_longer');
            req.authData = {
                email: decodedToken.email,
                id: decodedToken.userId,
                role: decodedToken.role,
                permeation: decodedToken.permeation
            };
            next();
        }
        else {
            res.status(401).json({
                message: 'Authorization header is missing'
            });
        }
    }
    catch (e) {
        res.status(401).json({
            message: 'middleware ::: ' + e
        });
    }
};
exports.default = authMiddleware;
