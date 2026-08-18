import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ANALYTICS_CONFIG } from './config';

interface GeoResult {
  country: string;
  region: string;
  city: string;
}

const geoCache = new Map<string, GeoResult>();

function isPrivateIP(ip: string): boolean {
  if (!ip) return true;
  return ip === '::1' || ip === 'localhost' ||
    ip.startsWith('127.') || ip.startsWith('10.') ||
    ip.startsWith('192.168.') || ip.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

export async function loadGeoCache(): Promise<void> {
  try {
    const text = await fs.readFile(path.join(ANALYTICS_CONFIG.DATA_DIR, 'geo-cache.json'), 'utf8');
    for (const [k, v] of Object.entries(JSON.parse(text))) geoCache.set(k, v as GeoResult);
  } catch { /* first run */ }
}

export function saveGeoCache(): void {
  fs.writeFile(path.join(ANALYTICS_CONFIG.DATA_DIR, 'geo-cache.json'), JSON.stringify(Object.fromEntries(geoCache)))
    .catch(() => {});
}

export async function lookupGeo(ip: string, ipHash: string): Promise<GeoResult | null> {
  if (ANALYTICS_CONFIG.GEO_MODE === 'none') return null;
  const cached = geoCache.get(ipHash);
  if (cached) return cached;
  if (isPrivateIP(ip)) return null;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const j = await res.json() as Record<string, unknown>;
    if (j.success === false) return null;
    const geo: GeoResult = {
      country: String(j.country || 'Unknown'),
      region: String(j.region || ''),
      city: String(j.city || ''),
    };
    geoCache.set(ipHash, geo);
    saveGeoCache();
    return geo;
  } catch {
    return null;
  }
}
