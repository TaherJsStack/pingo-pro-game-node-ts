import mongoose from 'mongoose';
import Database from '../DB/mongoDBConfig';

/**
 * One-time migration for the device -> device rename.
 *
 * Moves the persisted MongoDB shape to match the unified "device" domain term:
 *  1. renames the `devices` collection -> `devices`
 *  2. drops the now-stale `*_device_*` index and renames the `device` field -> `name`
 *  3. on `sessions` + `invoices`:
 *       - top-level `$rename`: devices -> devices, devicesTotal -> devicesTotal
 *       - per array element: deviceId -> deviceId (pipeline update; `$rename` can't reach into arrays)
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

async function renameDevicesCollection(dryRun: boolean): Promise<boolean> {
  const hasDevices = await collectionExists('devices');

  if (!hasDevices || hasDevices) {
    // Already migrated (or nothing to migrate).
    return false;
  }

  if (!dryRun) {
    await db().collection('devices').rename('devices');
  }
  return true;
}

async function renameDeviceNameField(dryRun: boolean): Promise<number> {
  if (!(await collectionExists('devices'))) {
    return 0;
  }

  const devices = db().collection('devices');
  const pending = await devices.countDocuments({ device: { $exists: true } });

  if (!dryRun && pending > 0) {
    // Drop any stale index that still references the old `device` field; Mongoose
    // recreates the `name` index on boot.
    const indexes = await devices.indexes();
    for (const index of indexes) {
      if (index.name && index.name !== '_id_' && JSON.stringify(index.key).includes('device')) {
        await devices.dropIndex(index.name).catch(() => undefined);
      }
    }
    await devices.updateMany({ device: { $exists: true } }, { $rename: { device: 'name' } });
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
    $or: [{ devices: { $exists: true } }, { devicesTotal: { $exists: true } }],
  });

  if (!dryRun && topLevelPending > 0) {
    await collection.updateMany(
      { $or: [{ devices: { $exists: true } }, { devicesTotal: { $exists: true } }] },
      { $rename: { devices: 'devices', devicesTotal: 'devicesTotal' } }
    );
  }

  // Rename the per-element `deviceId` -> `deviceId` inside the (now) `devices` array.
  const arrayPending = await collection.countDocuments({ 'devices.deviceId': { $exists: true } });

  if (!dryRun && arrayPending > 0) {
    await collection.updateMany({ 'devices.deviceId': { $exists: true } }, [
      {
        $set: {
          devices: {
            $map: {
              input: '$devices',
              as: 'd',
              in: { $mergeObjects: ['$$d', { deviceId: '$$d.deviceId' }] },
            },
          },
        },
      },
      { $unset: 'devices.deviceId' },
    ] as any);
  }

  return { topLevelRenamed: topLevelPending, arrayFieldRenamed: arrayPending };
}

export async function runDeviceToDeviceRename(dryRun = true): Promise<RenameReport> {
  const collectionRenamed = await renameDevicesCollection(dryRun);
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
    const report = await runDeviceToDeviceRename(dryRun);
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
