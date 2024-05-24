import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        const options: ConnectOptions = {
            // useNewUrlParser: true,
            // useUnifiedTopology: true,
        };
        await mongoose.connect(process.env.MONGODB_URL as string, options);
        console.log('MongoDB connected...');
    } catch (err) {
        console.error('Database connection failed:', (err as Error).message);
        throw err;
    }
};

const closeDB = async (): Promise<void> => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed...');
    } catch (err) {
        console.error('Error closing the database connection:', (err as Error).message);
        throw err;
    }
};

export { connectDB, closeDB };

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
