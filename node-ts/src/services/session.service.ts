import { Types } from 'mongoose';
import CategoryModel from '../models/category';
import ClientModel from '../models/client';
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

export class SessionService implements ISessionService {
  private readonly categoryRepository = new BaseRepository<any>(CategoryModel);
  private readonly clientRepository = new BaseRepository<any>(ClientModel);
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

  async createItem(body: ISession, authUserId: string): Promise<any> {
    const createdBy = new Types.ObjectId(authUserId);
    const currentShift = body.brancheId
      ? await ShiftService.getCurrentShift(authUserId, String(body.brancheId))
      : null;
    const incomingCategories = Array.isArray(body.categories) ? body.categories : [];
    const categories = incomingCategories.map((device: any) => ({
      ...device,
      createdBy,
      closedBy: device.closedBy ?? null,
      type: device.type ?? 'open',
      Sessiontype: device.Sessiontype ?? 'open',
      startTime: device.startTime ?? new Date(),
      price: Number(device.price ?? 0),
      estimationInHours: Number(device.estimationInHours ?? 0),
      estimationInMinutes: Number(device.estimationInMinutes ?? 0),
    }));

    const existingSession = body.clientId
      ? await this.sessionRepository.findActiveSessionByClientAndBranch(body.clientId, body.brancheId)
      : null;
    if (existingSession) {
      existingSession.categories.push(...categories);
      return existingSession.save();
    }

    return this.sessionRepository.create({
      ...body,
      createdBy,
      activeState: true,
      categories,
      shiftId: currentShift?._id ?? null,
    } as any);
  }

  async endSession(sessionId: string, body: any, authUserId: string): Promise<{ session: any; bill: any; message: string }> {
    const session = await this.sessionRepository.findById(sessionId);
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
        category.endTime = parsedEndTime;
        category.closedBy = closedBy;
      }
    }
    if (!matchedCategoryIds.size) {
      throw new ValidationError('No matching session categories were found for the provided categoriesIds list.');
    }

    if (body.description?.trim()) session.description = body.description.trim();
    await Promise.all([...matchedCategoryIds].map((categoryId) => this.categoryRepository.updateOne({ _id: new Types.ObjectId(categoryId) }, { $set: { bookState: false } })));

    const allCategoriesEnded = (session.categories as any[]).every((category) => !!category.endTime);
    if (allCategoriesEnded) session.activeState = false;
    const savedSession = await session.save();

    let createdBill = null;
    if (allCategoriesEnded) {
      const existingInvoice = await this.invoiceRepository.findOne({ sessionId: session._id });
      if (existingInvoice) {
        createdBill = existingInvoice;
      } else {
        const client = session.clientId ? await this.clientRepository.findById(session.clientId) : null;
        const invoicesCount = await this.invoiceRepository.countDocuments({ brancheId: session.brancheId });
        createdBill = await this.invoiceRepository.create({
          sessionId: session._id,
          shiftId: (session as any).shiftId ?? null,
          createdBy: new Types.ObjectId(authUserId),
          closedBy,
          brancheId: session.brancheId,
          clientId: session.clientId ?? null,
          name: body.name ?? client?.name ?? '',
          phone: body.phone ?? client?.phone ?? '',
          activeState: false,
          description: body.description ?? session.description ?? '',
          invoiceNo: 20250601 + invoicesCount + 1,
          categories: session.categories.map((category: any) => ({
            categoryId: category.categoryId,
            createdBy: category.createdBy ?? new Types.ObjectId(authUserId),
            closedBy: category.closedBy ?? closedBy,
            type: category.type ?? 'open',
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
        } as any);
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
