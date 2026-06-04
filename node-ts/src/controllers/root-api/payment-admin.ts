import { Request, Response } from 'express';
import {
  paymentInstrumentRepository,
  paymentRepository,
  subscriptionRepository,
  webhookEventRepository,
} from '../../repositories/instances';
import { SendResponse } from '../base/sendResponse';
import { toPublicPayment, toPublicPaymentMethod, toPublicWebhookEvent } from '../../util/redact';

function parsePaging(req: Request): { page: number; size: number } {
  const page = Math.max(Number(req.query.PageNo ?? req.query.page ?? 1), 1);
  const size = Math.min(Math.max(Number(req.query.PageSize ?? req.query.pageSize ?? 20), 1), 100);
  return { page, size };
}

function parseFilter(req: Request): Record<string, any> {
  const raw = req.query.filter;
  if (typeof raw === 'string' && raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Read-only, paginated, redacted operational views for root/admin support. Payments, saved
 * methods, and webhook events are passed through redaction helpers so tokens and raw callback
 * secrets are never returned. Mounted behind signReqData + rootAuthGuard.
 */
export class PaymentAdminController extends SendResponse {
  listSubscriptions = async (req: Request, res: Response): Promise<void> => {
    const { page, size } = parsePaging(req);
    const result = await subscriptionRepository.paginate(parseFilter(req), page, size);
    this.sendResponse(req, res, 200, result.items, result.totalData);
  };

  listPayments = async (req: Request, res: Response): Promise<void> => {
    const { page, size } = parsePaging(req);
    const result = await paymentRepository.paginate(parseFilter(req), page, size);
    this.sendResponse(req, res, 200, result.items.map(toPublicPayment), result.totalData);
  };

  listPaymentMethods = async (req: Request, res: Response): Promise<void> => {
    const { page, size } = parsePaging(req);
    const result = await paymentInstrumentRepository.paginate(parseFilter(req), page, size);
    this.sendResponse(req, res, 200, result.items.map(toPublicPaymentMethod), result.totalData);
  };

  listWebhookEvents = async (req: Request, res: Response): Promise<void> => {
    const { page, size } = parsePaging(req);
    const result = await webhookEventRepository.paginate(parseFilter(req), page, size);
    this.sendResponse(req, res, 200, result.items.map(toPublicWebhookEvent), result.totalData);
  };
}
