"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authCtrl = __importStar(require("../../controllers/api/auth"));
// Define the router
const authRouter = express_1.default.Router();
// Route handlers
authRouter.post("/", authCtrl.saveAuth);
authRouter.put("/member/:id", authCtrl.updateOne);
authRouter.put("/updatePassword", authCtrl.updatePassword);
authRouter.post("/login", authCtrl.login);
authRouter.get("/", authCtrl.getAll);
authRouter.get('/checkEmail/:email', authCtrl.checkEmail);
authRouter.get('/checkPassword/:id/:password', authCtrl.checkPassword);
authRouter.get('/getById/:authId', authCtrl.getById);
authRouter.delete('/:id', authCtrl.deleteOne);
// Export the router
exports.default = authRouter;
