import path from 'path';
import { loadEnv, resolveConfiguredPath } from '../../src/config/env';

const baseEnv = {
  MONGODB_URL: 'mongodb://127.0.0.1:27017/PINGO_TEST',
  SECRET: 'test_secret_this_should_be_long_enough',
  APP_BASE_URL: 'https://api.example.com/',
};

describe('deployment env config', () => {
  it('parses deployment settings and resolves upload paths', () => {
    const loaded = loadEnv({
      ...baseEnv,
      NODE_ENV: 'production',
      PORT: '4100',
      CORS_ORIGINS: 'https://app.example.com,http://localhost:4300',
      UPLOAD_PATH: 'runtime/uploads',
      PAYMENTS_ENABLED: 'true',
      ENABLE_BILLING_CRON: 'true',
      SWAGGER_ENABLED: 'false',
    });

    expect(loaded.isProduction).toBe(true);
    expect(loaded.port).toBe(4100);
    expect(loaded.appBaseUrl).toBe('https://api.example.com');
    expect(loaded.corsOrigins).toEqual(['https://app.example.com', 'http://localhost:4300']);
    expect(loaded.uploadPath).toBe(path.resolve(process.cwd(), 'runtime/uploads'));
    expect(loaded.paymentsEnabled).toBe(true);
    expect(loaded.billingCronEnabled).toBe(true);
    expect(loaded.swaggerEnabled).toBe(false);
    expect(loaded.swaggerServerUrl).toBe('https://api.example.com/api/v1');
  });

  it('fails clearly when required deployment settings are missing', () => {
    expect(() => loadEnv({ APP_BASE_URL: 'https://api.example.com' })).toThrow(
      'Missing required configuration: MONGODB_URL, SECRET'
    );
  });

  it('rejects invalid ports', () => {
    expect(() => loadEnv({ ...baseEnv, PORT: '70000' })).toThrow('Invalid PORT: 70000');
  });

  it('keeps absolute upload paths unchanged', () => {
    const absolutePath = path.resolve(process.cwd(), 'absolute-uploads');
    expect(resolveConfiguredPath(absolutePath)).toBe(absolutePath);
  });
});
