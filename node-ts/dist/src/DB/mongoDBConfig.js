"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class Database {
    constructor() {
        this.connectionString = process.env.MONGODB_URL;
        this.options = {
        // useNewUrlParser: true,
        // useUnifiedTopology: true,
        };
    }
    async connect() {
        try {
            await mongoose_1.default.connect(this.connectionString, this.options);
            console.log('MongoDB connected...');
        }
        catch (err) {
            console.error('Database connection failed:', err.message);
            throw err;
        }
    }
    async close() {
        try {
            await mongoose_1.default.connection.close();
            console.log('MongoDB connection closed...');
        }
        catch (err) {
            console.error('Error closing the database connection:', err.message);
            throw err;
        }
    }
}
exports.default = new Database();
// import mongoose, { ConnectOptions } from 'mongoose';
// import dotenv from 'dotenv';
// dotenv.config();
// const connectDB = async (): Promise<void> => {
//     try {
//         const options: ConnectOptions = {
//             // useNewUrlParser: true,
//             // useUnifiedTopology: true,
//         };
//         await mongoose.connect(process.env.MONGODB_URL as string, options);
//         console.log('MongoDB connected...');
//     } catch (err) {
//         console.error('Database connection failed:', (err as Error).message);
//         throw err;
//     }
// };
// const closeDB = async (): Promise<void> => {
//     try {
//         await mongoose.connection.close();
//         console.log('MongoDB connection closed...');
//     } catch (err) {
//         console.error('Error closing the database connection:', (err as Error).message);
//         throw err;
//     }
// };
// export { connectDB, closeDB };
