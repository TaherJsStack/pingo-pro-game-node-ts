import express from 'express';
import { AddressInfo } from 'net';
import { request as httpRequest } from 'http';
import { idempotencyMiddleware } from '../../src/middleware/idempotency';
import Auth from '../../src/models/auth';
import Tenant from '../../src/models/tenant';
import Branche from '../../src/models/branche';
import IdempotencyKey from '../../src/models/idempotency-key';

describe('idempotency middleware', () => {
  let server: any;
  let baseUrl = '';
  let tenantId = '';
  let counter = 0;

  beforeAll(async () => {
    const owner = await Auth.create({
      username: `idem-owner-${Date.now()}`,
      firstName: 'Owner',
      lastName: 'Tester',
      email: `idem-${Date.now()}-${Math.random()}@example.com`,
      phone: '01000000000',
      image: '',
      activeState: true,
      role: 2,
      permission: [2],
      authType: 'owner',
      permissions: [],
    } as any);

    const tenant = await Tenant.create({
      ownerId: owner._id,
      name: 'Idempotency Tenant',
      slug: `idem-tenant-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      activeState: true,
      description: '',
    } as any);
    tenantId = String(tenant._id);

    await Branche.create({
      ownerId: owner._id,
      tenantId: tenant._id,
      branche: 'Idempotency Branch',
      logo: '',
      address: '',
      activeState: true,
      description: '',
    } as any);

    const app = express();
    app.use(express.json());

    app.post('/mutations', (req, _res, next) => {
      (req as any).authData = { tenantId };
      next();
    }, idempotencyMiddleware, (_req, res) => {
      counter += 1;
      res.status(201).json({
        success: true,
        data: [{ counter }],
      });
    });

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server.close((error: Error | undefined) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      });
    }
  });

  afterEach(() => {
    counter = 0;
  });

  async function postJson(path: string, payload: unknown, key: string) {
    const url = new URL(path, baseUrl);
    const body = JSON.stringify(payload);

    return await new Promise<{ status: number; json: any }>((resolve, reject) => {
      const req = httpRequest(
        {
          method: 'POST',
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'Idempotency-Key': key,
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            resolve({
              status: res.statusCode ?? 0,
              json: text ? JSON.parse(text) : null,
            });
          });
        }
      );

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  it('replays the canonical response for the same key and payload', async () => {
    const key = `idem-${Date.now()}-${Math.random()}`;

    const first = await postJson('/mutations', { amount: 123 }, key);
    const second = await postJson('/mutations', { amount: 123 }, key);

    expect(first.status).toBe(201);
    expect(first.json.data[0].counter).toBe(1);
    expect(second.status).toBe(201);
    expect(second.json).toEqual(first.json);
    expect(counter).toBe(1);

    const stored = await IdempotencyKey.findOne({ tenantId, key });
    expect(stored?.status).toBe('completed');
  });

  it('rejects the same key when the payload changes', async () => {
    const key = `idem-conflict-${Date.now()}-${Math.random()}`;

    const first = await postJson('/mutations', { amount: 50 }, key);
    expect(first.status).toBe(201);

    const conflict = await postJson('/mutations', { amount: 99 }, key);

    expect(conflict.status).toBe(409);
    expect(conflict.json.errors[0]).toContain('different payload');
  });
});
