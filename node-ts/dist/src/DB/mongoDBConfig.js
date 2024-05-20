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
exports.closeDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const options = {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        };
        yield mongoose_1.default.connect(process.env.MONGODB_URL, options);
        console.log('MongoDB connected...');
    }
    catch (err) {
        console.error('Database connection failed:', err.message);
        throw err;
    }
});
exports.connectDB = connectDB;
const closeDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connection.close();
        console.log('MongoDB connection closed...');
    }
    catch (err) {
        console.error('Error closing the database connection:', err.message);
        throw err;
    }
});
exports.closeDB = closeDB;
// const mongoose = require('mongoose');
// require('dotenv').config();
// const connectDB = async () => {
//     try {
//         await mongoose.connect(process.env.MONGODB_URL, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });
//         console.log('MongoDB connected...');
//     } catch (err) {
//         console.error('Database connection failed:', err.message);
//         throw err;
//     }
// };
// const closeDB = async () => {
//     try {
//         await mongoose.connection.close();
//         console.log('MongoDB connection closed...');
//     } catch (err) {
//         console.error('Error closing the database connection:', err.message);
//         throw err;
//     }
// };
// module.exports = { connectDB, closeDB };
