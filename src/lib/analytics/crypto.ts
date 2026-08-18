import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { ANALYTICS_CONFIG } from './config';

export function hashIP(ip: string): string {
  return createHash('sha256').update(`${ip}|${ANALYTICS_CONFIG.SESSION_SECRET}`).digest('hex').slice(0, 40);
}

export function signToken(payload: Record<string, unknown>): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', ANALYTICS_CONFIG.SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string | null | undefined): boolean {
  if (!token) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = createHmac('sha256', ANALYTICS_CONFIG.SESSION_SECRET).update(body).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export function hashPassword(password: string): Buffer {
  return createHash('sha256').update(password).digest();
}
