import mongoose from 'mongoose';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';

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
