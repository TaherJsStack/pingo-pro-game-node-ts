import { NextFunction, Request, Response } from 'express';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export function createRateLimit(maxRequests: number, windowMs: number) {
  const buckets = new Map<string, RateLimitBucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}:${req.originalUrl.split('?')[0]}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > maxRequests) {
      res.status(429).json({
        success: false,
        errors: ['Too many requests'],
        status: 429,
        message: '',
        data: {},
      });
      return;
    }

    next();
  };
}
