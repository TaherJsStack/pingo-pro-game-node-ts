import mongoose from 'mongoose';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.PORT = process.env.PORT || '4001';
process.env.MONGODB_URL = process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/PINGO_TEST';
process.env.SECRET = process.env.SECRET || 'test_secret_this_should_be_long_enough';
process.env.APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:4001';
process.env.CORS_ORIGINS = process.env.CORS_ORIGINS || '*';
process.env.UPLOAD_PATH = process.env.UPLOAD_PATH || 'uploads';
process.env.PAYMENTS_ENABLED = process.env.PAYMENTS_ENABLED || 'false';
process.env.ENABLE_BILLING_CRON = process.env.ENABLE_BILLING_CRON || 'false';
process.env.SWAGGER_ENABLED = process.env.SWAGGER_ENABLED || 'false';

let mongoServer: MongoMemoryServer;
const mongoBinaryDownloadDir = path.resolve(process.cwd(), '.cache', 'mongodb-binaries');

jest.setTimeout(600000);

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      downloadDir: mongoBinaryDownloadDir,
      version: '6.0.13',
    },
  });
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
});
