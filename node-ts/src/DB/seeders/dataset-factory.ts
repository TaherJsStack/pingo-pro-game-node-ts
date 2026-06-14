import { Types } from 'mongoose';
import { deviceCharge, sumMoney, roundMoney } from '../../util/money';
import { Rng } from '../../util/seeded-random';

export interface SeedCtx {
  tenantId: Types.ObjectId;
  brancheId: Types.ObjectId;
  createdBy: Types.ObjectId;
}

// ── Clients ─────────────────────────────────────────────────────────────────

export function buildClientPayload(ctx: SeedCtx, rng: Rng, index: number) {
  let digits = '';
  for (let k = 0; k < 9; k++) digits += rng.int(0, 9);
  return {
    ownerId: ctx.createdBy,
    createdBy: ctx.createdBy,
    tenantId: ctx.tenantId,
    brancheId: ctx.brancheId,
    name: `Client ${index + 1}`,
    phone: `01${digits}`,
    activeState: true,
    description: `Seeded mock client #${index + 1}`,
    createdAt: new Date(),
  };
}

// ── Session devices ──────────────────────────────────────────────────────────

export function buildSessionDevices(
  devices: any[],
  employeeId: Types.ObjectId,
  shiftOpenedAt: Date,
  shiftClosedAt: Date,
  rng: Rng
): any[] {
  const shiftStart = shiftOpenedAt.getTime();
  const shiftEnd = shiftClosedAt.getTime();
  const shiftDuration = shiftEnd - shiftStart;

  const chosen = rng.shuffle(devices).slice(0, rng.int(1, Math.min(3, devices.length)));
  return chosen.map((dev) => {
    // startTime: random point within first 80% of shift
    const startOffset = rng.int(5, 60) * 60_000 + Math.floor(rng.next() * shiftDuration * 0.8);
    const startTime = new Date(shiftStart + startOffset);
    // duration: 20–90 minutes, capped so endTime < shiftClosedAt
    const maxMs = shiftEnd - startTime.getTime() - 60_000;
    const durationMs = Math.min(rng.int(20, 90) * 60_000, maxMs);
    const endTime = new Date(startTime.getTime() + Math.max(durationMs, 10 * 60_000));

    return {
      deviceId: new Types.ObjectId(String(dev._id)),
      createdBy: employeeId,
      closedBy: employeeId,
      type: String(dev.type ?? 'ROOM'),
      Sessiontype: 'open',
      mode: String(dev.mode ?? 'single'),
      price: Number(dev.price ?? 0),
      startTime,
      endTime,
      estimationInHours: 0,
      estimationInMinutes: 0,
    };
  });
}

// ── Session menu items (embedded) ────────────────────────────────────────────

export function buildSessionMenuItems(
  menu: any[],
  employeeId: Types.ObjectId,
  rng: Rng
): any[] {
  // 60% chance this session has menu items
  if (!menu.length || rng.bool(0.4)) return [];
  return rng.shuffle(menu).slice(0, rng.int(1, 3)).map((m) => ({
    itemID: new Types.ObjectId(String(m._id)),  // NOTE: itemID (not itemId) — matches menuItemSchema
    createdBy: employeeId,
    itemName: String(m.name ?? ''),
    price: Number(m.price ?? 0),
    quantity: rng.int(1, 3),
  }));
}

// ── Totals computation ────────────────────────────────────────────────────────

export function computeTotals(
  devices: any[],
  menuItems: any[]
): { devicesTotal: number; menuItemsTotal: number; total: number } {
  const devicesTotal = roundMoney(sumMoney(devices.map((d) => deviceCharge(d))));
  const menuItemsTotal = roundMoney(
    sumMoney(menuItems.map((m) => Number(m.quantity ?? 0) * Number(m.price ?? 0)))
  );
  return { devicesTotal, menuItemsTotal, total: roundMoney(devicesTotal + menuItemsTotal) };
}

// ── Session + Invoice pair ───────────────────────────────────────────────────

export function buildSessionAndInvoice(
  ctx: SeedCtx,
  shift: { _id: Types.ObjectId; employeeId: Types.ObjectId; openedAt: Date; closedAt: Date },
  devices: any[],
  menu: any[],
  clients: any[],
  rng: Rng,
  invoiceNo: number
): { session: any; invoice: any; sessionTotal: number } {
  const employeeId = shift.employeeId;
  const createdAt = new Date(
    shift.openedAt.getTime() +
    rng.next() * (shift.closedAt.getTime() - shift.openedAt.getTime())
  );
  const client = clients.length && rng.bool(0.7) ? rng.pick(clients) : null;
  const sessionId = new Types.ObjectId();

  const sDevices = buildSessionDevices(devices, employeeId, shift.openedAt, shift.closedAt, rng);
  const sMenuItems = buildSessionMenuItems(menu, employeeId, rng);
  const sTotals = computeTotals(sDevices, sMenuItems);

  const session = {
    _id: sessionId,
    createdBy: employeeId,
    tenantId: ctx.tenantId,
    brancheId: ctx.brancheId,
    clientId: client ? new Types.ObjectId(String(client._id)) : null,
    startedShiftId: shift._id,
    closedShiftId: shift._id,
    activeState: false,
    createdAt,
    description: `Seeded session • ${sDevices.map((d) => d.type).join(', ')}${client ? ' • ' + client.name : ''}`,
    devices: sDevices,
    menuItems: sMenuItems,
    devicesTotal: sTotals.devicesTotal,
    menuItemsTotal: sTotals.menuItemsTotal,
    total: sTotals.total,
  };

  const invoiceDevices = sDevices.map((d) => ({ ...d }));
  const invoiceMenuItems = sMenuItems.map((m) => ({ ...m }));
  const iTotals = computeTotals(invoiceDevices, invoiceMenuItems);

  const invoice = {
    createdBy: employeeId,
    closedBy: employeeId,
    tenantId: ctx.tenantId,
    brancheId: ctx.brancheId,
    sessionId,
    shiftId: shift._id,
    clientId: client ? new Types.ObjectId(String(client._id)) : null,
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    activeState: false,
    invoiceNo,
    createdAt,
    description: `Seeded invoice #${invoiceNo} • ${client?.name ?? 'walk-in'}`,
    devices: invoiceDevices,
    menuItems: invoiceMenuItems,
    devicesTotal: iTotals.devicesTotal,
    menuItemsTotal: iTotals.menuItemsTotal,
    total: iTotals.total,
  };

  return { session, invoice, sessionTotal: iTotals.total };
}

// ── Standalone InvoiceMenu (counter/bar order) ───────────────────────────────

export function buildInvoiceMenuRecord(
  ctx: SeedCtx,
  shiftEmployeeId: Types.ObjectId,
  client: any,
  menu: any[],
  rng: Rng,
  createdAt: Date
): any {
  const items = rng.shuffle(menu).slice(0, rng.int(1, 3)).map((m) => ({
    itemId: new Types.ObjectId(String(m._id)),   // invoiceMenuItemSchema uses itemId (lowercase)
    itemName: String(m.name ?? ''),
    price: Number(m.price ?? 0),
    quantity: rng.int(1, 4),
  }));

  const total = roundMoney(
    sumMoney(items.map((i) => Number(i.quantity) * Number(i.price)))
  );

  return {
    createdBy: shiftEmployeeId,
    tenantId: ctx.tenantId,
    brancheId: ctx.brancheId,
    client: new Types.ObjectId(String(client._id)),
    menuItems: items,
    total,
    activeState: true,
    createdAt,
    description: `Seeded counter order for ${client.name}`,
  };
}
