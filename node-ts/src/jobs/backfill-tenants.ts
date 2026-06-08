import mongoose, { Model } from 'mongoose';
import { env } from '../config/env';
import Database from '../DB/mongoDBConfig';
import Branche from '../models/branche';
import Device from '../models/device';
import Client from '../models/client';
import Menu from '../models/menu';
import Session from '../models/session';
import Invoice from '../models/invoice';
import InvoiceMenu from '../models/invoice-menu';
import Shift from '../models/shift';
import Inbox from '../models/inbox';
import ComplaintsSuggestion from '../models/complaints-suggestion';
import Settings from '../models/settings';

type TenantScopedModel = Model<any>;

interface BackfillCandidate {
  _id: mongoose.Types.ObjectId;
  brancheId: mongoose.Types.ObjectId;
}

interface BackfillReportEntry {
  model: string;
  examined: number;
  readyToUpdate: number;
  orphanCount: number;
}

export interface TenantBackfillReport {
  dryRun: boolean;
  models: BackfillReportEntry[];
  updatedCount: number;
  orphanCount: number;
  orphans: Array<{ model: string; documentId: string; brancheId?: string }>;
}

const BRANCHED_MODELS: Array<{ model: TenantScopedModel; name: string }> = [
  { model: Device, name: 'Device' },
  { model: Client, name: 'Client' },
  { model: Menu, name: 'Menu' },
  { model: Session, name: 'Session' },
  { model: Invoice, name: 'Invoice' },
  { model: InvoiceMenu, name: 'InvoiceMenu' },
  { model: Shift, name: 'Shift' },
  { model: Inbox, name: 'Inbox' },
  { model: ComplaintsSuggestion, name: 'ComplaintsSuggestion' },
  { model: Settings, name: 'Settings' },
];

async function resolveTenantId(brancheId: mongoose.Types.ObjectId): Promise<string | null> {
  const branch = await Branche.findById(brancheId).select('tenantId').lean();
  if (!branch?.tenantId) {
    return null;
  }
  return String(branch.tenantId);
}

async function collectCandidates(model: TenantScopedModel): Promise<BackfillCandidate[]> {
  return model.find({
    $or: [
      { tenantId: { $exists: false } },
      { tenantId: null },
    ],
    brancheId: { $exists: true, $ne: null },
  }, { _id: 1, brancheId: 1 }).lean();
}

async function backfillBranchedModel(
  model: TenantScopedModel,
  modelName: string,
  dryRun: boolean
): Promise<{
  report: BackfillReportEntry;
  updates: Array<{ id: string; tenantId: string }>;
  orphans: Array<{ model: string; documentId: string; brancheId?: string }>;
}> {
  const candidates = await collectCandidates(model);
  const updates: Array<{ id: string; tenantId: string }> = [];
  const orphans: Array<{ model: string; documentId: string; brancheId?: string }> = [];

  for (const candidate of candidates) {
    const tenantId = await resolveTenantId(candidate.brancheId);
    if (!tenantId) {
      orphans.push({
        model: modelName,
        documentId: String(candidate._id),
        brancheId: String(candidate.brancheId),
      });
      continue;
    }
    updates.push({ id: String(candidate._id), tenantId });
  }

  if (!dryRun && orphans.length === 0 && updates.length > 0) {
    await model.bulkWrite(
      updates.map(({ id, tenantId }) => ({
        updateOne: {
          filter: { _id: new mongoose.Types.ObjectId(id) },
          update: { $set: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
        },
      })) as any,
      { ordered: false }
    );
  }

  return {
    report: {
      model: modelName,
      examined: candidates.length,
      readyToUpdate: updates.length,
      orphanCount: orphans.length,
    },
    updates,
    orphans,
  };
}

export async function runTenantBackfill(dryRun = true): Promise<TenantBackfillReport> {
  const perModel: BackfillReportEntry[] = [];
  const allOrphans: TenantBackfillReport['orphans'] = [];
  let totalUpdates = 0;

  for (const entry of BRANCHED_MODELS) {
    const result = await backfillBranchedModel(entry.model, entry.name, dryRun);
    perModel.push(result.report);
    totalUpdates += result.updates.length;
    allOrphans.push(...result.orphans);
  }

  if (!dryRun && allOrphans.length > 0) {
    throw new Error(`Tenant backfill aborted: ${allOrphans.length} orphaned documents could not be resolved.`);
  }

  return {
    dryRun,
    models: perModel,
    updatedCount: totalUpdates,
    orphanCount: allOrphans.length,
    orphans: allOrphans,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run') || process.argv.includes('-n');
  await Database.connect();
  try {
    const report = await runTenantBackfill(dryRun);
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
