
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected...');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        throw err;
    }
};

const closeDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed...');
    } catch (err) {
        console.error('Error closing the database connection:', err.message);
        throw err;
    }
};

module.exports = { connectDB, closeDB };
