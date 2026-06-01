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

async function migrateInvoiceCategoryDates(): Promise<void> {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection is not available.');
  }

  const invoices = db.collection('invoices');
  const cursor = invoices.find(
    {
      categories: {
        $elemMatch: {
          $or: [
            { startTime: { $type: 'string' } },
            { endTime: { $type: 'string' } },
          ],
        },
      },
    },
    { projection: { categories: 1 } }
  );

    const operations: any[] = [];
  let scanned = 0;
  let changedDocs = 0;
  let normalizedValues = 0;

  for await (const invoice of cursor) {
    scanned += 1;
    const categories = Array.isArray(invoice.categories) ? invoice.categories : [];
    let docChanged = false;

    const normalizedCategories = categories.map((category: Record<string, unknown>) => {
      const nextCategory = { ...category };

      const nextStartTime = toDateOrNull(nextCategory.startTime);
      if (nextStartTime && typeof nextCategory.startTime === 'string') {
        nextCategory.startTime = nextStartTime;
        docChanged = true;
        normalizedValues += 1;
      }

      const nextEndTime = toDateOrNull(nextCategory.endTime);
      if (nextEndTime && typeof nextCategory.endTime === 'string') {
        nextCategory.endTime = nextEndTime;
        docChanged = true;
        normalizedValues += 1;
      }

      return nextCategory;
    });

    if (!docChanged) {
      continue;
    }

    changedDocs += 1;
    operations.push({
      updateOne: {
        filter: { _id: invoice._id },
        update: { $set: { categories: normalizedCategories } },
      },
    });
  }

  let modified = 0;
  if (operations.length > 0) {
    const result = await invoices.bulkWrite(operations, { ordered: false });
    modified = result.modifiedCount;
  }

  console.log(
    `[invoiceDates] invoices.categories: scanned=${scanned}, changedDocs=${changedDocs}, modified=${modified}, normalizedValues=${normalizedValues}`
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
    await migrateInvoiceCategoryDates();
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
