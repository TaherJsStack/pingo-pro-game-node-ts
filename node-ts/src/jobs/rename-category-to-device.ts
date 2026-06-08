import mongoose from 'mongoose';
import Database from '../DB/mongoDBConfig';

/**
 * One-time migration for the category -> device rename.
 *
 * Moves the persisted MongoDB shape to match the unified "device" domain term:
 *  1. renames the `categories` collection -> `devices`
 *  2. drops the now-stale `*_category_*` index and renames the `category` field -> `name`
 *  3. on `sessions` + `invoices`:
 *       - top-level `$rename`: categories -> devices, categoriesTotal -> devicesTotal
 *       - per array element: categoryId -> deviceId (pipeline update; `$rename` can't reach into arrays)
 *
 * Idempotent: re-running is a no-op once the fields/collection are already renamed.
 * Always back up the database first. Use `--dry-run` (or `-n`) to preview without writing.
 */

interface RenameReport {
  dryRun: boolean;
  collectionRenamed: boolean;
  deviceNameFieldRenamed: number;
  sessions: { topLevelRenamed: number; arrayFieldRenamed: number };
  invoices: { topLevelRenamed: number; arrayFieldRenamed: number };
}

function db() {
  const connection = mongoose.connection.db;
  if (!connection) {
    throw new Error('Mongo connection is not established.');
  }
  return connection;
}

async function collectionExists(name: string): Promise<boolean> {
  const matches = await db().listCollections({ name }).toArray();
  return matches.length > 0;
}

async function renameCategoriesCollection(dryRun: boolean): Promise<boolean> {
  const hasCategories = await collectionExists('categories');
  const hasDevices = await collectionExists('devices');

  if (!hasCategories || hasDevices) {
    // Already migrated (or nothing to migrate).
    return false;
  }

  if (!dryRun) {
    await db().collection('categories').rename('devices');
  }
  return true;
}

async function renameDeviceNameField(dryRun: boolean): Promise<number> {
  if (!(await collectionExists('devices'))) {
    return 0;
  }

  const devices = db().collection('devices');
  const pending = await devices.countDocuments({ category: { $exists: true } });

  if (!dryRun && pending > 0) {
    // Drop any stale index that still references the old `category` field; Mongoose
    // recreates the `name` index on boot.
    const indexes = await devices.indexes();
    for (const index of indexes) {
      if (index.name && index.name !== '_id_' && JSON.stringify(index.key).includes('category')) {
        await devices.dropIndex(index.name).catch(() => undefined);
      }
    }
    await devices.updateMany({ category: { $exists: true } }, { $rename: { category: 'name' } });
  }

  return pending;
}

async function migrateSessionShape(
  collectionName: 'sessions' | 'invoices',
  dryRun: boolean
): Promise<{ topLevelRenamed: number; arrayFieldRenamed: number }> {
  if (!(await collectionExists(collectionName))) {
    return { topLevelRenamed: 0, arrayFieldRenamed: 0 };
  }

  const collection = db().collection(collectionName);
  const topLevelPending = await collection.countDocuments({
    $or: [{ categories: { $exists: true } }, { categoriesTotal: { $exists: true } }],
  });

  if (!dryRun && topLevelPending > 0) {
    await collection.updateMany(
      { $or: [{ categories: { $exists: true } }, { categoriesTotal: { $exists: true } }] },
      { $rename: { categories: 'devices', categoriesTotal: 'devicesTotal' } }
    );
  }

  // Rename the per-element `categoryId` -> `deviceId` inside the (now) `devices` array.
  const arrayPending = await collection.countDocuments({ 'devices.categoryId': { $exists: true } });

  if (!dryRun && arrayPending > 0) {
    await collection.updateMany({ 'devices.categoryId': { $exists: true } }, [
      {
        $set: {
          devices: {
            $map: {
              input: '$devices',
              as: 'd',
              in: { $mergeObjects: ['$$d', { deviceId: '$$d.categoryId' }] },
            },
          },
        },
      },
      { $unset: 'devices.categoryId' },
    ] as any);
  }

  return { topLevelRenamed: topLevelPending, arrayFieldRenamed: arrayPending };
}

export async function runCategoryToDeviceRename(dryRun = true): Promise<RenameReport> {
  const collectionRenamed = await renameCategoriesCollection(dryRun);
  const deviceNameFieldRenamed = await renameDeviceNameField(dryRun);
  const sessions = await migrateSessionShape('sessions', dryRun);
  const invoices = await migrateSessionShape('invoices', dryRun);

  return {
    dryRun,
    collectionRenamed,
    deviceNameFieldRenamed,
    sessions,
    invoices,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
  await Database.connect();
  try {
    const report = await runCategoryToDeviceRename(dryRun);
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await Database.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  });
}
