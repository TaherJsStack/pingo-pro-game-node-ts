import * as http from 'http';
import type { AddressInfo } from 'net';
import App from '../../app';

function getJson(server: http.Server, path: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const address = server.address() as AddressInfo;
    const request = http.get(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path,
      },
      (response) => {
        let raw = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          raw += chunk;
        });
        response.on('end', () => {
          resolve({
            status: response.statusCode ?? 0,
            body: JSON.parse(raw),
          });
        });
      }
    );

    request.on('error', reject);
  });
}

describe('deployment health endpoints', () => {
  let server: http.Server | undefined;

  afterEach(async () => {
    if (!server) {
      return;
    }

    await new Promise<void>((resolve, reject) => {
      server?.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    server = undefined;
  });

  it('returns liveness and readiness responses', async () => {
    const app = new App();
    server = app.app.listen(0);

    const health = await getJson(server, '/healthz');
    const readiness = await getJson(server, '/readyz');

    expect(health.status).toBe(200);
    expect(health.body.status).toBe('ok');
    expect(readiness.status).toBe(200);
    expect(readiness.body.status).toBe('ready');
    expect(readiness.body.checks.mongo).toBe('connected');
  });
});
