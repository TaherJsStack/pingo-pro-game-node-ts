import { Types } from 'mongoose';
import CategoryModel from '../models/category';
import ClientModel from '../models/client';
import PricingModel from '../models/pricing';
import SessionModel from '../models/session';
import InvoiceModel from '../models/invoice';
import { BaseRepository } from '../repositories/BaseRepository';
import { SessionRepository } from '../repositories/SessionRepository';
import { InvoiceRepository } from '../repositories/InvoiceRepository';
import { ISession } from '../models/interfaces/session.interface';
import InvoiceService from './invoice.service';
import { ISessionService } from './interfaces/ISessionService';
import { NotFoundError, ValidationError } from '../errors/AppError';
import ShiftService from './shift.service';
import AnalyticsService from './analytics.service';
import { roundMoney } from '../util/money';
import RealtimeService from './realtime.service';
import { RealtimeEvent } from '../enums';

export class SessionService implements ISessionService {
  private readonly categoryRepository = new BaseRepository<any>(CategoryModel);
  private readonly clientRepository = new BaseRepository<any>(ClientModel);
  private readonly pricingRepository = new BaseRepository<any>(PricingModel);
  private readonly sessionRepository = new SessionRepository(SessionModel);
  private readonly invoiceRepository = new InvoiceRepository(InvoiceModel);

  private normalizeCategoryIds(body: any): string[] {
    const idsFromCategories = Array.isArray(body.categories)
      ? body.categories.map((category: any) => String(category?.categoryId ?? '')).filter(Boolean)
      : [];
    const requestedIds = (body.categoriesIds ?? (body.categoryId ? [body.categoryId] : idsFromCategories)) as Array<string | number>;
    return [...new Set(requestedIds.map((id) => String(id)).filter(Boolean))];
  }

  private toInvoiceDate(value: unknown): Date | undefined {
    if (!value) return undefined;
    const parsedDate = value instanceof Date ? value : new Date(value as string);
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  private resolvePriceValue(currentPrice: unknown, fallbackPrice: number): number {
    const parsedPrice = Number(currentPrice ?? 0);
    return parsedPrice > 0 ? parsedPrice : Number(fallbackPrice ?? 0);
  }

  private calculateDeviceRevenue(category: any): number {
    if (!category.startTime || !category.endTime) {
      return 0;
    }

    const startTime = category.startTime instanceof Date ? category.startTime : new Date(category.startTime);
    const endTime = category.endTime instanceof Date ? category.endTime : new Date(category.endTime);
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    return roundMoney(durationHours * Number(category.price ?? 0));
  }

  private async emitSessionAnalytics(
    session: any,
    eventType: 'session_opened' | 'session_closed',
    authUserId: string,
    tenantId?: string
  ): Promise<void> {
    if (!tenantId || !session?.brancheId) {
      return;
    }

    const basePayload = {
      tenantId,
      brancheId: String(session.brancheId),
      shiftId: session.shiftId ? String(session.shiftId) : null,
      sessionId: String(session._id),
      occurredAt: new Date(),
    };

    await Promise.all(
      (session.categories ?? []).map((category: any) =>
        AnalyticsService.recordEvent({
          ...basePayload,
          deviceType: String(category.type ?? 'room'),
          eventType,
          amount: 0,
          metadata: {
            categoryId: String(category.categoryId),
            createdBy: authUserId,
          },
        })
      )
    );
  }

  private async resolvePricingPolicy(
    brancheId: string | Types.ObjectId,
    deviceType: string,
    tenantId?: string
  ): Promise<{ pricingId: any; pricingMode: string; price: number }> {
    const scope = { tenantId, requireTenant: true };
    for (const mode of ['vip', 'package', 'hourly']) {
      const pricing = await this.pricingRepository.findOne(
        {
          brancheId: new Types.ObjectId(String(brancheId)),
          deviceType,
          type: mode,
          activeState: true,
        },
        scope
      );
      if (pricing) {
        return {
          pricingId: pricing._id,
          pricingMode: pricing.type ?? mode,
          price: Number(pricing.price ?? 0),
        };
      }
    }

    return {
      pricingId: null,
      pricingMode: 'hourly',
      price: 0,
    };
  }

  async createItem(body: ISession, authUserId: string, tenantId?: string): Promise<any> {
    const createdBy = new Types.ObjectId(authUserId);
    const scope = { tenantId, requireTenant: true };
    const currentShift = body.brancheId
      ? await ShiftService.getCurrentShift(authUserId, String(body.brancheId), tenantId)
      : null;
    const incomingCategories = Array.isArray(body.categories) ? body.categories : [];
    const clientRequestId = (body as any).clientRequestId ? String((body as any).clientRequestId) : undefined;
    const categories = await Promise.all(
      incomingCategories.map(async (device: any) => {
        const deviceType = String(device.type ?? 'room');
        const pricing = await this.resolvePricingPolicy(body.brancheId as any, deviceType, tenantId);
        return {
          ...device,
          createdBy,
          closedBy: device.closedBy ?? null,
          type: deviceType,
          Sessiontype: device.Sessiontype ?? 'open',
          pricingId: device.pricingId ?? pricing.pricingId,
          pricingMode: device.pricingMode ?? pricing.pricingMode,
          startTime: device.startTime ?? new Date(),
          price: this.resolvePriceValue(device.price, pricing.price),
          estimationInHours: Number(device.estimationInHours ?? 0),
          estimationInMinutes: Number(device.estimationInMinutes ?? 0),
        };
      })
    );

    if (clientRequestId) {
      const result = await this.sessionRepository.upsertByClientRequestId(
        {
          ...body,
          createdBy,
          tenantId: tenantId ? new Types.ObjectId(tenantId) : null,
          activeState: true,
          categories,
          shiftId: currentShift?._id ?? null,
          clientRequestId,
        } as any,
        scope
      );

      if (result.created) {
        await this.emitSessionAnalytics(result.item, 'session_opened', authUserId, tenantId);
        if (tenantId) {
          RealtimeService.emitToTenant(tenantId, RealtimeEvent.SessionOpened, {
            tenantId,
            brancheId: String(body.brancheId ?? ''),
            sessionId: String(result.item._id),
            shiftId: result.item.shiftId ? String(result.item.shiftId) : null,
          });
          RealtimeService.emitToTenant(tenantId, RealtimeEvent.TableStatusChanged, {
            tenantId,
            brancheId: String(body.brancheId ?? ''),
            sessionId: String(result.item._id),
            shiftId: result.item.shiftId ? String(result.item.shiftId) : null,
            activeState: true,
          });
        }
      }

      return result.item;
    }

    const existingSession = body.clientId
      ? await this.sessionRepository.findActiveSessionByClientAndBranch(body.clientId, body.brancheId, scope)
      : null;
    if (existingSession) {
      existingSession.categories.push(...categories);
      return existingSession.save();
    }

    const createdSession = await this.sessionRepository.create({
      ...body,
      createdBy,
      tenantId: tenantId ? new Types.ObjectId(tenantId) : null,
      activeState: true,
      categories,
      shiftId: currentShift?._id ?? null,
    } as any, scope);

    await this.emitSessionAnalytics(createdSession, 'session_opened', authUserId, tenantId);
    if (tenantId) {
      RealtimeService.emitToTenant(tenantId, RealtimeEvent.SessionOpened, {
        tenantId,
        brancheId: String(body.brancheId ?? ''),
        sessionId: String(createdSession._id),
        shiftId: createdSession.shiftId ? String(createdSession.shiftId) : null,
      });
      RealtimeService.emitToTenant(tenantId, RealtimeEvent.TableStatusChanged, {
        tenantId,
        brancheId: String(body.brancheId ?? ''),
        sessionId: String(createdSession._id),
        shiftId: createdSession.shiftId ? String(createdSession.shiftId) : null,
        activeState: true,
      });
    }
    return createdSession;
  }

  async endSession(sessionId: string, body: any, authUserId: string, tenantId?: string): Promise<{ session: any; bill: any; message: string }> {
    const scope = { tenantId, requireTenant: true };
    const session = await this.sessionRepository.findById(sessionId, scope);
    if (!session) throw new NotFoundError('Session not found');

    const requestedCategoryIds = this.normalizeCategoryIds(body);
    if (!requestedCategoryIds.length) throw new ValidationError('At least one categoryId is required to end a session.');

    const parsedEndTime = body.endTime ? new Date(body.endTime) : new Date();
    if (Number.isNaN(parsedEndTime.getTime())) throw new ValidationError('Invalid endTime value.');

    const closedBy = new Types.ObjectId(authUserId);
    const matchedCategoryIds = new Set<string>();
    for (const category of session.categories as any[]) {
      const categoryId = String(category.categoryId);
      if (!requestedCategoryIds.includes(categoryId)) continue;
      matchedCategoryIds.add(categoryId);
      if (!category.endTime) {
        const pricing = await this.resolvePricingPolicy(session.brancheId, String(category.type ?? 'room'), tenantId);
        category.endTime = parsedEndTime;
        category.closedBy = closedBy;
        category.pricingId = category.pricingId ?? pricing.pricingId;
        category.pricingMode = category.pricingMode ?? pricing.pricingMode;
        category.price = this.resolvePriceValue(category.price, pricing.price);
      }
    }
    if (!matchedCategoryIds.size) {
      throw new ValidationError('No matching session categories were found for the provided categoriesIds list.');
    }

    if (body.description?.trim()) session.description = body.description.trim();
    await Promise.all([
      ...matchedCategoryIds,
    ].map((categoryId) =>
      this.categoryRepository.updateOne(
        { _id: new Types.ObjectId(categoryId) },
        { $set: { bookState: false } },
        { scope }
      )
    ));

    const allCategoriesEnded = (session.categories as any[]).every((category) => !!category.endTime);
    if (allCategoriesEnded) session.activeState = false;
    const savedSession = await session.save();

    await this.emitSessionAnalytics(savedSession, 'session_closed', authUserId, tenantId);
    if (tenantId || (session as any).tenantId) {
      const resolvedTenantId = tenantId ?? String((session as any).tenantId);
      RealtimeService.emitToTenant(resolvedTenantId, RealtimeEvent.SessionClosed, {
        tenantId: resolvedTenantId,
        brancheId: String(session.brancheId),
        sessionId: String(session._id),
        shiftId: (session as any).shiftId ? String((session as any).shiftId) : null,
        activeState: false,
      });
      RealtimeService.emitToTenant(resolvedTenantId, RealtimeEvent.TableStatusChanged, {
        tenantId: resolvedTenantId,
        brancheId: String(session.brancheId),
        sessionId: String(session._id),
        shiftId: (session as any).shiftId ? String((session as any).shiftId) : null,
        activeState: false,
      });
    }

    if (tenantId || (session as any).tenantId) {
      await Promise.all(
        (session.categories as any[]).map((category) =>
          AnalyticsService.recordEvent({
            tenantId: tenantId ?? String((session as any).tenantId),
            brancheId: String(session.brancheId),
            shiftId: (session as any).shiftId ? String((session as any).shiftId) : null,
            sessionId: String(session._id),
            invoiceId: null,
            deviceType: String(category.type ?? 'room'),
            eventType: 'device_utilization',
            amount: this.calculateDeviceRevenue(category),
            occurredAt: this.toInvoiceDate(category.endTime) ?? parsedEndTime,
            metadata: {
              categoryId: String(category.categoryId),
              pricingMode: category.pricingMode ?? 'hourly',
            },
          })
        )
      );
    }

    let createdBill = null;
    if (allCategoriesEnded) {
      const existingInvoice = await this.invoiceRepository.findOne({ sessionId: session._id }, scope);
      if (existingInvoice) {
        createdBill = existingInvoice;
      } else {
        if (!tenantId) {
          throw new Error('Tenant scope is required to create invoices.');
        }
        if (!session.brancheId) {
          throw new Error('Branche is required to create invoices.');
        }
        const client = session.clientId ? await this.clientRepository.findById(session.clientId, scope) : null;
        const invoiceNo = await InvoiceService.allocateInvoiceNo(tenantId, session.brancheId);
        createdBill = await this.invoiceRepository.create({
          sessionId: session._id,
          tenantId: tenantId ? new Types.ObjectId(tenantId) : (session as any).tenantId ?? null,
          shiftId: (session as any).shiftId ?? null,
          createdBy: new Types.ObjectId(authUserId),
          closedBy,
          brancheId: session.brancheId,
          clientId: session.clientId ?? null,
          name: body.name ?? client?.name ?? '',
          phone: body.phone ?? client?.phone ?? '',
          activeState: false,
          description: body.description ?? session.description ?? '',
          invoiceNo,
          categories: session.categories.map((category: any) => ({
            categoryId: category.categoryId,
            createdBy: category.createdBy ?? new Types.ObjectId(authUserId),
            closedBy: category.closedBy ?? closedBy,
            type: category.type ?? 'open',
            pricingId: category.pricingId ?? null,
            pricingMode: category.pricingMode ?? 'hourly',
            price: Number(category.price ?? 0),
            startTime: this.toInvoiceDate(category.startTime) ?? new Date(),
            endTime: this.toInvoiceDate(category.endTime),
            estimationTime: category.estimationTime ?? '',
            estimationInHours: Number(category.estimationInHours ?? 0),
            estimationInMinutes: Number(category.estimationInMinutes ?? 0),
          })),
          menuItems: Array.isArray(session.menuItems)
            ? session.menuItems.map((item: any) => ({
                itemID: item.itemID,
                createdBy: item.createdBy ?? new Types.ObjectId(authUserId),
                itemName: item.itemName,
                quantity: Number(item.quantity ?? 0),
                price: Number(item.price ?? 0),
              }))
            : [],
        } as any, scope);
        await InvoiceService.syncInvoiceTotals(createdBill);
      }
    }

    return {
      session: savedSession,
      bill: createdBill,
      message: createdBill ? 'Session ended and bill created successfully.' : 'Session categories ended successfully.',
    };
  }
}
