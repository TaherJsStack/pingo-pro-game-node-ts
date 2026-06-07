import path from 'path';
import { config } from 'dotenv';

config();

type EnvSource = NodeJS.ProcessEnv | Record<string, string | undefined>;

export interface AppEnv {
  nodeEnv: string;
  isProduction: boolean;
  port: number;
  mongodbUrl: string;
  secret: string;
  appBaseUrl: string;
  corsOrigins: string[];
  uploadPath: string;
  redisUrl: string;
  paymentsEnabled: boolean;
  billingCronEnabled: boolean;
  swaggerEnabled: boolean;
  swaggerServerUrl: string;
}

export function envValue(source: EnvSource, key: string): string {
  const value = source[key] ?? source[`${key} `];
  return typeof value === 'string' ? value.trim().replace(/^"|"$/g, '') : '';
}

export function parseBooleanValue(value: string, defaultValue: boolean): boolean {
  if (!value) {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function resolveConfiguredPath(value: string, baseDir = process.cwd()): string {
  const configuredPath = value || 'uploads';
  return path.isAbsolute(configuredPath)
    ? path.normalize(configuredPath)
    : path.resolve(baseDir, configuredPath);
}

function requireValue(source: EnvSource, key: string, missing: string[]): string {
  const value = envValue(source, key);
  if (!value) {
    missing.push(key);
  }
  return value;
}

function parsePort(value: string): number {
  const port = Number(value || 4001);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }
  return port;
}

function parseOrigins(value: string): string[] {
  const origins = (value || '*')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : ['*'];
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function loadEnv(source: EnvSource = process.env): AppEnv {
  const missing: string[] = [];
  const nodeEnv = envValue(source, 'NODE_ENV') || 'development';
  const isProduction = nodeEnv === 'production';
  const appBaseUrl = trimTrailingSlash(requireValue(source, 'APP_BASE_URL', missing));

  const loaded: AppEnv = {
    nodeEnv,
    isProduction,
    port: parsePort(envValue(source, 'PORT')),
    mongodbUrl: requireValue(source, 'MONGODB_URL', missing),
    secret: requireValue(source, 'SECRET', missing),
    appBaseUrl,
    corsOrigins: parseOrigins(envValue(source, 'CORS_ORIGINS')),
    uploadPath: resolveConfiguredPath(envValue(source, 'UPLOAD_PATH')),
    redisUrl: envValue(source, 'REDIS_URL'),
    paymentsEnabled: parseBooleanValue(envValue(source, 'PAYMENTS_ENABLED'), false),
    billingCronEnabled: parseBooleanValue(envValue(source, 'ENABLE_BILLING_CRON'), false),
    swaggerEnabled: parseBooleanValue(envValue(source, 'SWAGGER_ENABLED'), !isProduction),
    swaggerServerUrl: trimTrailingSlash(envValue(source, 'SWAGGER_SERVER_URL') || `${appBaseUrl}/api/v1`),
  };

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  return Object.freeze(loaded);
}

export const env = loadEnv();
