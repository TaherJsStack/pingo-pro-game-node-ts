import * as dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';

dotenv.config();

type ObjectIdFieldMigration = {
  collectionName: string;
  fieldName: string;
};

const objectIdFieldMigrations: ObjectIdFieldMigration[] = [
  { collectionName: 'subscriptions', fieldName: 'ownerId' },
  { collectionName: 'subscriptions', fieldName: 'userId' },
  { collectionName: 'subscriptions', fieldName: 'plan' },
  { collectionName: 'audits', fieldName: 'auditById' },
  { collectionName: 'invoicemenus', fieldName: 'client' },
];

const toDateOrNull = (value: unknown): Date | null => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

async function migratePermissionField(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not available.');
  }

  const collections = ['auths', 'owners', 'audits'];

  for (const collectionName of collections) {
    const result = await db.collection(collectionName).updateMany(
      { permeation: { $exists: true } },
      [
        {
          $set: {
            permission: { $ifNull: ['$permission', '$permeation'] },
          },
        },
        {
          $unset: 'permeation',
        },
      ]
    );

    console.log(
      `[permission] ${collectionName}: matched=${result.matchedCount}, modified=${result.modifiedCount}`
    );
  }
}

async function migrateObjectIdFields(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not available.');
  }

  for (const migration of objectIdFieldMigrations) {
    const collection = db.collection(migration.collectionName);
    const cursor = collection.find(
      { [migration.fieldName]: { $type: 'string' } },
      { projection: { [migration.fieldName]: 1 } }
    );

    const operations: any[] = [];
    let scanned = 0;
    let invalid = 0;

    for await (const doc of cursor) {
      scanned += 1;
      const rawValue = doc[migration.fieldName];

      if (typeof rawValue !== 'string' || !Types.ObjectId.isValid(rawValue)) {
        invalid += 1;
        continue;
      }

      operations.push({
        updateOne: {
          filter: { _id: doc._id },
          update: {
            $set: { [migration.fieldName]: new Types.ObjectId(rawValue) },
          },
        },
      });
    }

    let modified = 0;
    if (operations.length > 0) {
      const result = await collection.bulkWrite(operations, { ordered: false });
      modified = result.modifiedCount;
    }

    console.log(
      `[objectId] ${migration.collectionName}.${migration.fieldName}: scanned=${scanned}, converted=${modified}, invalid=${invalid}`
    );
  }
}

async function migrateInvoiceDeviceDates(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not available.');
  }

  const invoices = db.collection('invoices');
  const cursor = invoices.find(
    {
      devices: {
        $elemMatch: {
          $or: [
            { startTime: { $type: 'string' } },
            { endTime: { $type: 'string' } },
          ],
        },
      },
    },
    { projection: { devices: 1 } }
  );

    const operations: any[] = [];
  let scanned = 0;
  let changedDocs = 0;
  let normalizedValues = 0;

  for await (const invoice of cursor) {
    scanned += 1;
    const devices = Array.isArray(invoice.devices) ? invoice.devices : [];
    let docChanged = false;

    const normalizedDevices = devices.map((device: Record<string, unknown>) => {
      const nextDevice = { ...device };

      const nextStartTime = toDateOrNull(nextDevice.startTime);
      if (nextStartTime && typeof nextDevice.startTime === 'string') {
        nextDevice.startTime = nextStartTime;
        docChanged = true;
        normalizedValues += 1;
      }

      const nextEndTime = toDateOrNull(nextDevice.endTime);
      if (nextEndTime && typeof nextDevice.endTime === 'string') {
        nextDevice.endTime = nextEndTime;
        docChanged = true;
        normalizedValues += 1;
      }

      return nextDevice;
    });

    if (!docChanged) {
      continue;
    }

    changedDocs += 1;
    operations.push({
      updateOne: {
        filter: { _id: invoice._id },
        update: { $set: { devices: normalizedDevices } },
      },
    });
  }

  let modified = 0;
  if (operations.length > 0) {
    const result = await invoices.bulkWrite(operations, { ordered: false });
    modified = result.modifiedCount;
  }

  console.log(
    `[invoiceDates] invoices.devices: scanned=${scanned}, changedDocs=${changedDocs}, modified=${modified}, normalizedValues=${normalizedValues}`
  );
}

async function run(): Promise<void> {
  const mongoUrl = process.env.MONGODB_URL;
  if (!mongoUrl) {
    throw new Error('Missing MONGODB_URL in environment.');
  }

  await mongoose.connect(mongoUrl);
  console.log('Connected to MongoDB for SOLID migration.');

  try {
    await migratePermissionField();
    await migrateObjectIdFields();
    await migrateInvoiceDeviceDates();
    console.log('SOLID migration completed.');
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

run().catch((error: Error) => {
  console.error(`SOLID migration failed: ${error.message}`);
  process.exitCode = 1;
});
