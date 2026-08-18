import type { APIRoute } from 'astro';

export const prerender = false;
import { ANALYTICS_CONFIG } from '../../lib/analytics/config';
import { hashIP } from '../../lib/analytics/crypto';
import { parseUA } from '../../lib/analytics/ua';
import { classifySource } from '../../lib/analytics/source';
import { lookupGeo } from '../../lib/analytics/geo';
import { sessions, views, upsertSession, addView, type Session } from '../../lib/analytics/storage';
import { ensureInitialized } from '../../lib/analytics/init';

function clientIP(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (ANALYTICS_CONFIG.TRUST_PROXY && fwd) {
    const first = fwd.split(',')[0].trim();
    if (first) return first;
  }
  return '127.0.0.1';
}

export const POST: APIRoute = async ({ request }) => {
  await ensureInitialized();
  let data: Record<string, any> = {};
  try {
    data = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'bad request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const event = String(data.event || '');
  const sid = String(data.sid || '');
  if (!sid || sid.length > 128 || !['session', 'view', 'heartbeat', 'exit'].includes(event)) {
    return new Response(JSON.stringify({ error: 'bad request' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const now = Number(data.now) > 0 ? Number(data.now) : Date.now();
  const ip = clientIP(request);
  const ipHash = hashIP(ip);
  const ua = request.headers.get('user-agent') || '';
  const parsed = parseUA(ua);
  const existing = sessions.get(sid);

  if (event === 'session') {
    if (existing) {
      existing.lastSeen = Math.max(existing.lastSeen, now);
      upsertSession(existing);
      return new Response(null, { status: 204 });
    }
    const cid = String(data.cid || '').slice(0, 64) || ipHash;
    const page = String(data.page || '/').slice(0, 300);
    let recent: Session | null = null;
    for (const s of sessions.values()) {
      if (s.firstSeen > now || now - s.firstSeen >= ANALYTICS_CONFIG.DEDUPE_MS) continue;
      if (s.cid === cid || s.ipHash === ipHash) {
        if (!recent || s.firstSeen > recent.firstSeen) recent = s;
      }
    }
    if (recent) {
      recent.lastSeen = Math.max(recent.lastSeen, now);
      recent.exit = page;
      upsertSession(recent);
      return new Response(null, { status: 204 });
    }
    const geo = await lookupGeo(ip, ipHash);
    const session: Session = {
      sid,
      cid,
      ipHash,
      country: geo?.country || 'Unknown',
      region: geo?.region || '',
      city: geo?.city || '',
      tz: String(data.tz || '').slice(0, 64),
      lang: String(data.lang || '').slice(0, 32),
      screen: String(data.screen || '').slice(0, 32),
      device: parsed.device,
      browser: parsed.browser,
      os: parsed.os,
      refSource: classifySource(data.ref, data.origin),
      ref: String(data.ref || '').slice(0, 500),
      landing: page,
      exit: page,
      firstSeen: now,
      lastSeen: now,
    };
    upsertSession(session);
    addView({ sid, page, ts: now });
    return new Response(null, { status: 204 });
  }

  if (!existing) {
    return new Response(null, { status: 204 });
  }

  if (event === 'view') {
    const page = String(data.page || '/').slice(0, 300);
    existing.exit = page;
    existing.lastSeen = Math.max(existing.lastSeen, now);
    upsertSession(existing);
    addView({ sid, page, ts: now });
    return new Response(null, { status: 204 });
  }

  if (event === 'heartbeat' || event === 'exit') {
    const dur = Number(data.dur);
    if (event === 'exit' && dur > 0) {
      existing.lastSeen = Math.max(existing.lastSeen, Math.min(now, existing.firstSeen + dur));
    } else {
      existing.lastSeen = Math.max(existing.lastSeen, now);
    }
    upsertSession(existing);
    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 204 });
};
