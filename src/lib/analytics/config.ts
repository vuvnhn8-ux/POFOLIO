import path from 'node:path';
import { randomBytes } from 'node:crypto';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../..');

export const ANALYTICS_CONFIG = {
  DATA_DIR: process.env.ANALYTICS_DATA_DIR || path.join(PROJECT_ROOT, 'analytics-data'),
  SESSION_SECRET: process.env.ANALYTICS_SESSION_SECRET || randomBytes(32).toString('hex'),
  ADMIN_PASSWORD: process.env.ANALYTICS_ADMIN_PASSWORD || randomBytes(12).toString('hex'),
  GEO_MODE: process.env.ANALYTICS_GEO_MODE || 'auto',
  RETENTION_DAYS: Math.max(1, Number(process.env.ANALYTICS_RETENTION_DAYS || 365)),
  SECURE_COOKIE: process.env.ANALYTICS_SECURE_COOKIE === '1',
  TRUST_PROXY: process.env.ANALYTICS_TRUST_PROXY === '1',
  COOKIE_MAX_AGE: 7 * 24 * 60 * 60,
  DAY_MS: 24 * 60 * 60 * 1000,
  DEDUPE_MS: 30_000,
};
