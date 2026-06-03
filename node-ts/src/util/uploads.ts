import fs from 'fs';
import { Request } from 'express';
import { env } from '../config/env';

export function ensureUploadDirectory(): void {
  fs.mkdirSync(env.uploadPath, { recursive: true });
}

export function getUploadPath(): string {
  return env.uploadPath;
}

export function buildUploadUrl(req: Request, filename: string): string {
  const baseUrl = env.appBaseUrl || `${req.protocol}://${req.get('host')}`;
  return `${baseUrl.replace(/\/+$/, '')}/api/uploads/${filename}`;
}
