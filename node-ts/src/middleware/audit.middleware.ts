import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { BaseRepository } from '../repositories/BaseRepository';
import AuditModel from '../models/audit';

const auditRepository = new BaseRepository<any>(AuditModel);

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.on('finish', async () => {
    try {
      const authData = (req as any).authData;
      await auditRepository.create({
        action: req.url,
        method: req.method,
        baseUrl: req.baseUrl,
        platform: req.headers['sec-ch-ua-platform']?.toString(),
        success: res.statusCode < 400 ? 'success' : 'failed',
        status: String(res.statusCode),
        error: res.statusCode < 400 ? '' : 'request failed',
        auditByName: authData?.name ?? '',
        auditById: authData?.id ? new mongoose.Types.ObjectId(authData.id) : new mongoose.Types.ObjectId(),
        auditOn: new Date(),
        role: Number(authData?.role ?? 0),
        permission: Array.isArray(authData?.permission) ? authData.permission : [],
      });
    } catch (_error) {
      // best effort only
    }
  });

  next();
}
