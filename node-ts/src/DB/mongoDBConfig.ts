import mongoose, { ConnectOptions } from 'mongoose';
import { env } from '../config/env';

class Database {
  private connectionString: string;
  private options: ConnectOptions;

  constructor() {
    this.connectionString = env.mongodbUrl;
    this.options = {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    };
  }

  public async connect(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        return;
      }
      await mongoose.connect(this.connectionString, this.options);
      console.log('MongoDB connected...');
    } catch (err) {
      console.error('Database connection failed:', (err as Error).message);
      throw err;
    }
  }

  public async close(): Promise<void> {
    try {
      if (mongoose.connection.readyState === 0) {
        return;
      }
      await mongoose.connection.close();
      console.log('MongoDB connection closed...');
    } catch (err) {
      console.error('Error closing the database connection:', (err as Error).message);
      throw err;
    }
  }

  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}

export default new Database();



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
