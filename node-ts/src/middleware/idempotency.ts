import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import IdempotencyKeyModel from '../models/idempotency-key';
import { IdempotencyStatus } from '../enums/idempotency-status.enum';

type IdempotencyRequest = Request & {
  authData?: {
    tenantId?: string;
  };
  idempotency?: {
    key: string;
    route: string;
    requestHash: string;
    recordId: string;
  };
};

function stableSerialize(value: any): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`);

  return `{${entries.join(',')}}`;
}

function buildRequestHash(req: Request): string {
  const payload = {
    method: req.method,
    route: `${req.baseUrl ?? ''}${req.route?.path ?? req.path ?? ''}`,
    params: req.params ?? {},
    query: req.query ?? {},
    body: req.body ?? {},
  };

  return crypto.createHash('sha256').update(stableSerialize(payload)).digest('hex');
}

async function waitForCompletion(tenantId: string, key: string, requestHash: string) {
  const attempts = 20;
  const delayMs = 100;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const current = await IdempotencyKeyModel.findOne({ tenantId, key }).lean();
    if (!current) {
      return null;
    }

    if (current.requestHash !== requestHash) {
      return current;
    }

    if (current.status !== IdempotencyStatus.InProgress) {
      return current;
    }

    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  return await IdempotencyKeyModel.findOne({ tenantId, key }).lean();
}

export async function idempotencyMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const typedReq = req as IdempotencyRequest;
  const tenantId = typedReq.authData?.tenantId;
  const key = req.header('Idempotency-Key')?.trim();

  if (!tenantId) {
    res.status(400).json({
      success: false,
      errors: ['Tenant scope is required for idempotent writes.'],
      status: 400,
      message: '',
      data: {},
    });
    return;
  }

  if (!key) {
    res.status(400).json({
      success: false,
      errors: ['Idempotency-Key header is required.'],
      status: 400,
      message: '',
      data: {},
    });
    return;
  }

  const route = `${req.baseUrl ?? ''}${req.route?.path ?? req.path ?? ''}`;
  const requestHash = buildRequestHash(req);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  let record = await IdempotencyKeyModel.findOne({ tenantId, key });
  let createdNewRecord = false;

  if (!record) {
    try {
      record = await IdempotencyKeyModel.create({
        tenantId,
        key,
        route,
        requestHash,
        status: IdempotencyStatus.InProgress,
        responseSnapshot: null,
        expiresAt,
      });
      createdNewRecord = true;
    } catch (error: any) {
      if (error?.code !== 11000) {
        throw error;
      }

      record = await IdempotencyKeyModel.findOne({ tenantId, key });
    }
  }

  if (!record) {
    res.status(500).json({
      success: false,
      errors: ['Unable to prepare idempotency state.'],
      status: 500,
      message: '',
      data: {},
    });
    return;
  }

  if (record.requestHash !== requestHash) {
    res.status(409).json({
      success: false,
      errors: ['Idempotency-Key was reused with a different payload.'],
      status: 409,
      message: '',
      data: {},
    });
    return;
  }

  if (record.status === IdempotencyStatus.Completed && record.responseSnapshot) {
    const snapshot = record.responseSnapshot as { statusCode: number; body: any };
    res.status(snapshot.statusCode).send(snapshot.body);
    return;
  }

  if (record.status === IdempotencyStatus.InProgress && !createdNewRecord) {
    const settled = await waitForCompletion(tenantId, key, requestHash);
    if (settled?.status === IdempotencyStatus.Completed && settled.responseSnapshot) {
      const snapshot = settled.responseSnapshot as { statusCode: number; body: any };
      res.status(snapshot.statusCode).send(snapshot.body);
      return;
    }

    if (settled?.status === IdempotencyStatus.Failed) {
      await IdempotencyKeyModel.updateOne(
        { tenantId, key },
        {
          $set: {
            status: IdempotencyStatus.InProgress,
            responseSnapshot: null,
            route,
            requestHash,
            expiresAt,
          },
        }
      );
    } else if (settled?.status === IdempotencyStatus.InProgress) {
      res.status(409).json({
        success: false,
        errors: ['Idempotency-Key is already being processed. Please retry shortly.'],
        status: 409,
        message: '',
        data: {},
      });
      return;
    }
  }

  typedReq.idempotency = {
    key,
    route,
    requestHash,
    recordId: String(record._id),
  };

  let capturedBody: any;
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let finalized = false;

  const capture = (body: any) => {
    capturedBody = body;
    return body;
  };

  res.json = ((body: any) => originalJson(capture(body))) as Response['json'];
  res.send = ((body: any) => originalSend(capture(body))) as Response['send'];

  res.once('finish', () => {
    if (finalized) {
      return;
    }
    finalized = true;

    void IdempotencyKeyModel.updateOne(
      { tenantId, key },
      {
        $set: {
          status: res.statusCode >= 400 ? IdempotencyStatus.Failed : IdempotencyStatus.Completed,
          responseSnapshot: {
            statusCode: res.statusCode,
            body: capturedBody,
          },
          route,
          requestHash,
          expiresAt,
        },
      }
    ).catch((error) => {
      console.error('Failed to finalize idempotency record:', error);
    });
  });

  next();
}
