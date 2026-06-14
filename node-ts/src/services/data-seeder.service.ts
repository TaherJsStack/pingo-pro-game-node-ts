import { Types } from 'mongoose';
import { createRng } from '../util/seeded-random';
import { roundMoney } from '../util/money';
import { IDataSeedParams, IDataSeedResult } from '../models/interfaces/data-seeder.interface';
import {
  buildClientPayload,
  buildSessionAndInvoice,
  buildInvoiceMenuRecord,
  SeedCtx,
} from '../DB/seeders/dataset-factory';
import { buildDefaultDevices, buildDefaultMenu } from '../DB/seeders/owner-seed.data';
import {
  authRepository,
  brancheRepository,
  clientRepository,
  deviceRepository,
  menuRepository,
} from '../repositories/instances';
import ShiftModel from '../models/shift';
import SessionModel from '../models/session';
import InvoiceModel from '../models/invoice';
import InvoiceMenuModel from '../models/invoice-menu';
import CounterModel from '../models/counter';
import ClientModel from '../models/client';
import DeviceModel from '../models/device';
import MenuModel from '../models/menu';
import { AuthType } from '../enums/auth-type.enum';
import { ShiftStatus } from '../enums/shift-status.enum';

const MIN_CLIENTS = 20;
const SESSIONS_MIN = 20;
const SESSIONS_MAX = 30;
const INVOICE_MENUS_MIN = 3;
const INVOICE_MENUS_MAX = 6;
const MONTHS_BACK = 60;           // 5 years
const SHIFTS_PER_DAY_MIN = 3;
const SHIFTS_PER_DAY_MAX = 5;
const SLOT_HOURS = [6, 10, 14, 18, 22]; // morning / midday / afternoon / evening / night
const CHUNK = 2000;

class DataSeederService {
  // ── helpers ──────────────────────────────────────────────────────────────

  private isWeekend(d: Date): boolean {
    const day = d.getDay();
    return day === 0 || day === 6;
  }

  private buildShiftDoc(
    employeeId: Types.ObjectId,
    ctx: SeedCtx,
    date: Date,
    openedBy: Types.ObjectId,
    rng: ReturnType<typeof createRng>,
    slotHour: number
  ) {
    const openedAt = new Date(date);
    openedAt.setHours(slotHour, rng.int(0, 29), 0, 0);
    const workedMinutes = rng.int(180, 300);                // 3–5 hours per slot
    const closedAt = new Date(openedAt.getTime() + workedMinutes * 60_000);
    const openingCash = rng.int(500, 2000);

    return {
      _id: new Types.ObjectId(),
      employeeId,
      tenantId: ctx.tenantId,
      brancheId: ctx.brancheId,
      openedBy,
      closedBy: employeeId,
      openedAt,
      closedAt,
      openingCash,
      closingCash: 0,                                     // reconciled after inserts
      invoicesTotal: 0,                                   // reconciled
      sessionsStarted: 0,                                 // reconciled
      sessionsEnded: 0,                                   // reconciled
      workedMinutes,
      status: ShiftStatus.Closed,
      activeState: true,
      description: `Seeded closed shift • ${date.toISOString().slice(0, 10)}`,
      createdAt: new Date(openedAt),
    };
  }

  private async insertChunked<T>(Model: any, docs: T[]): Promise<void> {
    for (let i = 0; i < docs.length; i += CHUNK) {
      await Model.insertMany(docs.slice(i, i + CHUNK), { ordered: false });
    }
  }

  private async allocateInvoiceNos(
    tenantId: string,
    brancheId: string,
    count: number
  ): Promise<number> {
    const counter = await CounterModel.findOneAndUpdate(
      { tenantId, brancheId, scope: 'invoice' },
      { $inc: { sequence: count } },
      { upsert: true, new: false }
    );
    return (counter?.sequence ?? 0) + 1;
  }

  // ── Prerequisites ─────────────────────────────────────────────────────────

  private async ensureDevices(ctx: SeedCtx): Promise<any[]> {
    const scope = { tenantId: ctx.tenantId.toString(), requireTenant: true };
    let devices = await deviceRepository.find({ brancheId: ctx.brancheId, activeState: true }, { scope });
    if (!devices.length) {
      const payloads = buildDefaultDevices({
        ownerId: ctx.createdBy,
        tenantId: ctx.tenantId,
        brancheId: ctx.brancheId,
        createdBy: ctx.createdBy,
      });
      await this.insertChunked(DeviceModel, payloads);
      devices = await deviceRepository.find({ brancheId: ctx.brancheId, activeState: true }, { scope });
    }
    return devices;
  }

  private async ensureMenu(ctx: SeedCtx): Promise<any[]> {
    const scope = { tenantId: ctx.tenantId.toString(), requireTenant: true };
    let menu = await menuRepository.find({ brancheId: ctx.brancheId, activeState: true }, { scope });
    if (!menu.length) {
      const payloads = buildDefaultMenu({
        ownerId: ctx.createdBy,
        tenantId: ctx.tenantId,
        brancheId: ctx.brancheId,
        createdBy: ctx.createdBy,
      });
      await this.insertChunked(MenuModel, payloads);
      menu = await menuRepository.find({ brancheId: ctx.brancheId, activeState: true }, { scope });
    }
    return menu;
  }

  private async ensureClients(ctx: SeedCtx, rng: ReturnType<typeof createRng>): Promise<any[]> {
    const scope = { tenantId: ctx.tenantId.toString(), requireTenant: true };
    let clients = await clientRepository.find({ brancheId: ctx.brancheId, activeState: true }, { scope });
    if (clients.length < MIN_CLIENTS) {
      const toCreate = [];
      for (let i = clients.length; i < MIN_CLIENTS; i++) {
        toCreate.push(buildClientPayload(ctx, rng, i));
      }
      await ClientModel.insertMany(toCreate, { ordered: false });
      clients = await clientRepository.find({ brancheId: ctx.brancheId, activeState: true }, { scope });
    }
    return clients;
  }

  // ── Main entry point ──────────────────────────────────────────────────────

  async seedForBranch(params: IDataSeedParams): Promise<IDataSeedResult> {
    const { branchId, tenantId, createdBy, seed } = params;
    const rng = createRng(seed);
    const scope = { tenantId, requireTenant: true };

    // 1. Validate branch belongs to this tenant
    const branch = await brancheRepository.findOne(
      { _id: new Types.ObjectId(branchId), activeState: true },
      scope
    );
    if (!branch) throw new Error(`Branch ${branchId} not found in this tenant`);

    const ctx: SeedCtx = {
      tenantId: new Types.ObjectId(tenantId),
      brancheId: new Types.ObjectId(branchId),
      createdBy: new Types.ObjectId(createdBy),
    };

    // 2. Load employees
    const employees = await authRepository.find(
      { authType: AuthType.Employee, brancheId: ctx.brancheId, activeState: true },
      { scope }
    );
    if (!employees.length) {
      return { shiftsCreated: 0, sessionsCreated: 0, invoicesCreated: 0, invoiceMenusCreated: 0, clientsEnsured: 0, employeeCount: 0, skipped: 0, daysProcessed: 0 };
    }

    // 3. Ensure prerequisites
    const [devices, menu, clients] = await Promise.all([
      this.ensureDevices(ctx),
      this.ensureMenu(ctx),
      this.ensureClients(ctx, rng),
    ]);

    const clientsEnsured = clients.length;

    // 4. Build date range
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startFrom = new Date();
    startFrom.setMonth(startFrom.getMonth() - MONTHS_BACK);
    startFrom.setHours(0, 0, 0, 0);

    // 5. Collect working days (skip weekends + ~10% random)
    const workingDays: Date[] = [];
    const cursor = new Date(startFrom);
    while (cursor <= today) {
      if (!this.isWeekend(cursor) && !rng.bool(0.1)) {
        workingDays.push(new Date(cursor));
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // 6. Idempotency check — find days already seeded for this branch
    const existingShifts = await ShiftModel.find(
      { brancheId: ctx.brancheId, openedAt: { $gte: startFrom, $lte: today } },
      { openedAt: 1 }
    ).lean();
    const seededDays = new Set(
      existingShifts.map((s: any) => new Date(s.openedAt).toISOString().slice(0, 10))
    );

    const daysToSeed = workingDays.filter(
      (d) => !seededDays.has(d.toISOString().slice(0, 10))
    );
    const skipped = workingDays.length - daysToSeed.length;

    if (!daysToSeed.length) {
      return { shiftsCreated: 0, sessionsCreated: 0, invoicesCreated: 0, invoiceMenusCreated: 0, clientsEnsured, employeeCount: employees.length, skipped, daysProcessed: workingDays.length };
    }

    // 7. Allocate invoice numbers block (sessions are per-day totals, spread across shifts)
    const sessionsPerDay = Math.round((SESSIONS_MIN + SESSIONS_MAX) / 2);
    const estimatedInvoices = daysToSeed.length * sessionsPerDay;
    let invoiceNo = await this.allocateInvoiceNos(tenantId, branchId, estimatedInvoices);

    // 8. Build all documents
    const shiftDocs: any[] = [];
    const sessionDocs: any[] = [];
    const invoiceDocs: any[] = [];
    const invoiceMenuDocs: any[] = [];

    for (const day of daysToSeed) {
      // Pick 3–5 evenly-spaced time slots for this day (always in chronological order)
      const shiftsToday = rng.int(SHIFTS_PER_DAY_MIN, SHIFTS_PER_DAY_MAX);
      const slots = SLOT_HOURS.slice(0, shiftsToday); // [6,10,14,18,22] → first N

      // Divide total daily sessions evenly across shifts
      const totalDaySessions = rng.int(SESSIONS_MIN, SESSIONS_MAX);
      const baseSessions = Math.floor(totalDaySessions / shiftsToday);
      const remainder = totalDaySessions % shiftsToday;

      for (let si = 0; si < shiftsToday; si++) {
        const employee = rng.pick(employees);
        const employeeId = new Types.ObjectId(String(employee._id));
        const openedBy = ctx.createdBy;
        const shift = this.buildShiftDoc(employeeId, ctx, day, openedBy, rng, slots[si]);

        const sessionsCount = baseSessions + (si < remainder ? 1 : 0);
        let shiftInvoicesTotal = 0;

        for (let s = 0; s < sessionsCount; s++) {
          const { session, invoice, sessionTotal } = buildSessionAndInvoice(
            ctx,
            { _id: shift._id, employeeId, openedAt: shift.openedAt, closedAt: shift.closedAt },
            devices,
            menu,
            clients,
            rng,
            invoiceNo++
          );
          sessionDocs.push(session);
          invoiceDocs.push(invoice);
          shiftInvoicesTotal += sessionTotal;
        }

        // Standalone InvoiceMenu records (counter/bar orders)
        const menuOrdersCount = rng.int(INVOICE_MENUS_MIN, INVOICE_MENUS_MAX);
        for (let m = 0; m < menuOrdersCount; m++) {
          const client = rng.pick(clients);
          const orderTime = new Date(
            shift.openedAt.getTime() +
            rng.next() * (shift.closedAt.getTime() - shift.openedAt.getTime())
          );
          invoiceMenuDocs.push(
            buildInvoiceMenuRecord(ctx, employeeId, client, menu, rng, orderTime)
          );
        }

        // Reconcile shift aggregates
        shift.invoicesTotal = roundMoney(shiftInvoicesTotal);
        shift.closingCash = roundMoney(shift.openingCash + shiftInvoicesTotal);
        shift.sessionsStarted = sessionsCount;
        shift.sessionsEnded = sessionsCount;

        shiftDocs.push(shift);
      }
    }

    // 9. Batch insert (shifts first for FK integrity during reads)
    await this.insertChunked(ShiftModel, shiftDocs);
    await this.insertChunked(SessionModel, sessionDocs);
    await this.insertChunked(InvoiceModel, invoiceDocs);
    await this.insertChunked(InvoiceMenuModel, invoiceMenuDocs);

    return {
      shiftsCreated: shiftDocs.length,
      sessionsCreated: sessionDocs.length,
      invoicesCreated: invoiceDocs.length,
      invoiceMenusCreated: invoiceMenuDocs.length,
      clientsEnsured,
      employeeCount: employees.length,
      skipped,
      daysProcessed: workingDays.length,
    };
  }
}

export default new DataSeederService();
