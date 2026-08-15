// Privacy-friendly visitor analytics for the polofio portfolio.
// Zero dependencies. Node 18+ (global fetch required).
// Endpoints:
//   POST /api/track    - anonymous visitor events (session / view / heartbeat / exit)
//   GET  /api/health   - liveness probe
//   GET  /api/stats    - aggregated stats (dashboard, auth required)
//   GET  /analytics    - private dashboard (auth required, redirects to /analytics/login)
//   POST /analytics/login  - password login, sets HMAC-signed cookie
//   POST /analytics/logout - clears the session cookie
// Storage: append-only NDJSON files in ANALYTICS_DATA_DIR (sessions.jsonl, pageviews.jsonl).

import http from 'node:http';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.ANALYTICS_DATA_DIR || path.join(__dirname, 'data');
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_SECRET = process.env.ANALYTICS_SESSION_SECRET || randomBytes(32).toString('hex');
const ADMIN_PASSWORD = process.env.ANALYTICS_ADMIN_PASSWORD || randomBytes(12).toString('hex');
const ALLOWED_ORIGINS = (process.env.ANALYTICS_ALLOWED_ORIGINS || '*')
  .split(',').map((s) => s.trim()).filter(Boolean);
const TRUST_PROXY = process.env.ANALYTICS_TRUST_PROXY === '1';
const GEO_MODE = process.env.ANALYTICS_GEO_MODE || 'auto';
const RETENTION_DAYS = Math.max(1, Number(process.env.ANALYTICS_RETENTION_DAYS || 365));
const SECURE_COOKIE = process.env.ANALYTICS_SECURE_COOKIE === '1';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEDUPE_MS = 30_000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function mime(file) {
  return MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
}

function hashIP(ip) {
  return createHash('sha256').update(`${ip}|${SESSION_SECRET}`).digest('hex').slice(0, 40);
}

function parseUA(ua) {
  const u = (ua || '').toLowerCase();
  let device = 'desktop';
  if (/ipad|tablet|playbook|silk/.test(u) || (/android/.test(u) && !/mobile/.test(u))) device = 'tablet';
  else if (/mobile|iphone|ipod|android|windows phone|blackberry/.test(u)) device = 'mobile';

  let browser = 'Other';
  if (/edg\//.test(u) || /edgios/.test(u)) browser = 'Edge';
  else if (/opr\/|opera/.test(u)) browser = 'Opera';
  else if (/micromessenger/.test(u)) browser = 'WeChat';
  else if (/samsungbrowser/.test(u)) browser = 'Samsung Internet';
  else if (/chrome|crios/.test(u)) browser = 'Chrome';
  else if (/firefox|fxios/.test(u)) browser = 'Firefox';
  else if (/safari/.test(u)) browser = 'Safari';

  let os = 'Other';
  if (/windows nt/.test(u)) os = 'Windows';
  else if (/iphone|ipad|ipod/.test(u)) os = 'iOS';
  else if (/mac os x|macintosh/.test(u)) os = 'macOS';
  else if (/android/.test(u)) os = 'Android';
  else if (/linux|ubuntu|fedora|debian|arch/.test(u)) os = 'Linux';

  return { device, browser, os };
}

function classifySource(referrer, siteOrigin) {
  if (!referrer) return 'direct';
  let host = '';
  try { host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, ''); } catch { return 'other'; }
  let siteHost = '';
  try { siteHost = new URL(siteOrigin || 'http://localhost').hostname.toLowerCase().replace(/^www\./, ''); } catch { /* ignore */ }
  if (siteHost && (host === siteHost || host.endsWith(`.${siteHost}`))) return 'internal';
  if (host === 'google' || host.endsWith('google.') || host === 'google.com' || host.endsWith('.google.com')) return 'google';
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com') || host === 'linkedin') return 'linkedin';
  if (host === 'facebook.com' || host.endsWith('.facebook.com') || host === 'fb.com' || host.endsWith('.fb.com')) return 'facebook';
  return 'other';
}

function clientIP(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (TRUST_PROXY && fwd) {
    const first = String(fwd).split(',')[0].trim();
    if (first) return first;
  }
  return (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
}

function isPrivateIP(ip) {
  if (!ip) return true;
  return ip === '::1' || ip === 'localhost' ||
    ip.startsWith('127.') || ip.startsWith('10.') ||
    ip.startsWith('192.168.') || ip.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip);
}

const geoCache = new Map();

async function loadGeoCache() {
  try {
    const text = await fs.readFile(path.join(DATA_DIR, 'geo-cache.json'), 'utf8');
    for (const [k, v] of Object.entries(JSON.parse(text))) geoCache.set(k, v);
  } catch { /* first run */ }
}

function saveGeoCache() {
  fs.writeFile(path.join(DATA_DIR, 'geo-cache.json'), JSON.stringify(Object.fromEntries(geoCache)))
    .catch(() => {});
}

async function lookupGeo(ip, ipHash) {
  if (GEO_MODE === 'none') return null;
  const cached = geoCache.get(ipHash);
  if (cached) return cached;
  if (isPrivateIP(ip)) return null;
  try {
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, {
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const j = await res.json();
    if (j.success === false) return null;
    const geo = {
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

const sessions = new Map();
const views = [];
let writeQueue = Promise.resolve();

function appendLine(file, record) {
  const line = `${JSON.stringify(record)}\n`;
  writeQueue = writeQueue.then(() => fs.appendFile(path.join(DATA_DIR, file), line, 'utf8')).catch(() => {});
}

function upsertSession(s) {
  sessions.set(s.sid, s);
  appendLine('sessions.jsonl', s);
}

function addView(v) {
  views.push(v);
  appendLine('pageviews.jsonl', v);
}

async function initStorage() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await loadGeoCache();

  const loadLines = async (file) => {
    const out = [];
    try {
      const text = await fs.readFile(path.join(DATA_DIR, file), 'utf8');
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try { out.push(JSON.parse(line)); } catch { /* skip corrupt line */ }
      }
    } catch { /* file absent on first run */ }
    return out;
  };

  const cutoff = Date.now() - RETENTION_DAYS * DAY_MS;
  let changed = false;
  for (const s of await loadLines('sessions.jsonl')) {
    if (s.sid && s.firstSeen && s.firstSeen >= cutoff) sessions.set(s.sid, s);
    else changed = true;
  }
  for (const v of await loadLines('pageviews.jsonl')) {
    if (v && v.ts && v.ts >= cutoff) views.push(v);
    else changed = true;
  }
  if (changed) compact();
}

function compact() {
  const lines = [...sessions.values()].map((s) => JSON.stringify(s)).join('\n');
  writeQueue = writeQueue.then(async () => {
    await fs.writeFile(path.join(DATA_DIR, 'sessions.jsonl'), lines, 'utf8');
    await fs.writeFile(path.join(DATA_DIR, 'pageviews.jsonl'),
      views.map((v) => JSON.stringify(v)).join('\n'), 'utf8');
  }).catch(() => {});
}

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token) return false;
  const [body, sig] = token.split('.');
  if (!body || !sig) return false;
  const expected = createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' && payload.exp > Date.now();
  } catch {
    return false;
  }
}

function getCookie(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) return part.slice(idx + 1).trim();
  }
  return null;
}

function isAuthed(req) {
  return verifyToken(getCookie(req, 'pa_session'));
}

function buildCookie(token) {
  let cookie = `pa_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${COOKIE_MAX_AGE}`;
  if (SECURE_COOKIE) cookie += '; Secure';
  return cookie;
}

function clearCookie() {
  let cookie = 'pa_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  if (SECURE_COOKIE) cookie += '; Secure';
  return cookie;
}

function corsAllowed(req) {
  const origin = req.headers.origin;
  if (!origin) return '*';
  if (ALLOWED_ORIGINS.includes('*')) return '*';
  return ALLOWED_ORIGINS.includes(origin) ? origin : null;
}

function respond(req, res, status, body, headers = {}) {
  const origin = corsAllowed(req);
  res.writeHead(status, {
    'Access-Control-Allow-Origin': origin || 'none',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    ...headers,
  });
  res.end(body === null ? '' : body);
}

function json(req, res, status, data) {
  respond(req, res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8' });
}

function redirect(res, location, extra = {}) {
  res.writeHead(302, { Location: location, ...extra });
  res.end();
}

function readBody(req, limit = 65536) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(new Error('payload too large'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function handleTrack(req, res) {
  let data = {};
  try {
    const text = await readBody(req, 65536);
    data = JSON.parse(text || '{}');
  } catch {
    json(req, res, 400, { error: 'bad request' });
    return;
  }

  const event = String(data.event || '');
  const sid = String(data.sid || '');
  if (!sid || sid.length > 128 || !['session', 'view', 'heartbeat', 'exit'].includes(event)) {
    json(req, res, 400, { error: 'bad request' });
    return;
  }

  const now = Number(data.now) > 0 ? Number(data.now) : Date.now();
  const ip = clientIP(req);
  const ipHash = hashIP(ip);
  const parsed = parseUA(req.headers['user-agent']);
  const existing = sessions.get(sid);

  if (event === 'session') {
    if (existing) {
      existing.lastSeen = Math.max(existing.lastSeen, now);
      upsertSession(existing);
      respond(req, res, 204, null);
      return;
    }
    const cid = String(data.cid || '').slice(0, 64) || ipHash;
    const page = String(data.page || '/').slice(0, 300);
    let recent = null;
    for (const s of sessions.values()) {
      if (s.firstSeen > now || now - s.firstSeen >= DEDUPE_MS) continue;
      if (s.cid === cid || s.ipHash === ipHash) {
        if (!recent || s.firstSeen > recent.firstSeen) recent = s;
      }
    }
    if (recent) {
      recent.lastSeen = Math.max(recent.lastSeen, now);
      recent.exit = page;
      upsertSession(recent);
      respond(req, res, 204, null);
      return;
    }
    const geo = await lookupGeo(ip, ipHash);
    const session = {
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
    respond(req, res, 204, null);
    return;
  }

  if (!existing) {
    respond(req, res, 204, null);
    return;
  }

  if (event === 'view') {
    const page = String(data.page || '/').slice(0, 300);
    existing.exit = page;
    existing.lastSeen = Math.max(existing.lastSeen, now);
    upsertSession(existing);
    addView({ sid, page, ts: now });
    respond(req, res, 204, null);
    return;
  }

  if (event === 'heartbeat' || event === 'exit') {
    const dur = Number(data.dur);
    if (event === 'exit' && dur > 0) {
      existing.lastSeen = Math.max(existing.lastSeen, Math.min(now, existing.firstSeen + dur));
    } else {
      existing.lastSeen = Math.max(existing.lastSeen, now);
    }
    upsertSession(existing);
    respond(req, res, 204, null);
    return;
  }

  respond(req, res, 204, null);
}

function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ts) {
  const d = new Date(startOfDay(ts));
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.getTime();
}

function startOfMonth(ts) {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function countBy(list, getter) {
  const map = new Map();
  for (const item of list) {
    const k = getter(item) || 'Unknown';
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function uniqueCount(list) {
  return new Set(list.map((s) => s.cid || s.ipHash)).size;
}

function computeStats(days) {
  const now = Date.now();
  const cutoff = days > 0 ? now - days * DAY_MS : 0;

  const inRange = (ts) => !cutoff || ts >= cutoff;
  const rs = [...sessions.values()].filter((s) => inRange(s.firstSeen));
  const rv = views.filter((v) => inRange(v.ts));

  const cityKey = (s) => {
    const city = s.city || '';
    const country = s.country || '';
    if (city && country && country !== 'Unknown') return `${city}, ${country}`;
    return city || country || 'Unknown';
  };

  const today = startOfDay(now);
  const week = startOfWeek(now);
  const month = startOfMonth(now);
  const inRange2 = (s, from) => s.firstSeen >= from;

  let bucketDays = days > 0 ? days : 30;
  if (days <= 0) {
    let earliest = now;
    for (const s of sessions.values()) earliest = Math.min(earliest, s.firstSeen);
    const span = Math.max(0, Math.ceil((now - earliest) / DAY_MS)) + 1;
    bucketDays = Math.min(180, Math.max(30, span));
  }

  const timeseries = [];
  for (let i = bucketDays - 1; i >= 0; i -= 1) {
    const dayStart = startOfDay(now - i * DAY_MS);
    const dayEnd = dayStart + DAY_MS;
    const daySessions = [...sessions.values()].filter((s) => s.firstSeen >= dayStart && s.firstSeen < dayEnd);
    const dayViews = views.filter((v) => v.ts >= dayStart && v.ts < dayEnd);
    const d = new Date(dayStart);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    timeseries.push({
      date,
      visitors: daySessions.length,
      unique: uniqueCount(daySessions),
      pageviews: dayViews.length,
    });
  }

  const recent = [...rs]
    .sort((a, b) => b.firstSeen - a.firstSeen)
    .slice(0, 20)
    .map((s) => ({
      time: new Date(s.firstSeen).toISOString(),
      page: s.landing,
      country: s.country,
      city: s.city,
      device: s.device,
      browser: s.browser,
      os: s.os,
      duration: Math.max(0, Math.round((s.lastSeen - s.firstSeen) / 1000)),
      source: s.refSource,
      screen: s.screen,
    }));

  return {
    generatedAt: new Date(now).toISOString(),
    range: {
      days,
      from: cutoff ? new Date(cutoff).toISOString() : null,
      to: new Date(now).toISOString(),
    },
    totals: {
      visits: rs.length,
      unique: uniqueCount(rs),
      pageviews: rv.length,
    },
    today: {
      visits: rs.filter((s) => inRange2(s, today)).length,
      unique: uniqueCount(rs.filter((s) => inRange2(s, today))),
      pageviews: rv.filter((v) => v.ts >= today).length,
    },
    week: {
      visits: rs.filter((s) => inRange2(s, week)).length,
      unique: uniqueCount(rs.filter((s) => inRange2(s, week))),
      pageviews: rv.filter((v) => v.ts >= week).length,
    },
    month: {
      visits: rs.filter((s) => inRange2(s, month)).length,
      unique: uniqueCount(rs.filter((s) => inRange2(s, month))),
      pageviews: rv.filter((v) => v.ts >= month).length,
    },
    topPages: countBy(rv, (v) => v.page).slice(0, 10),
    topCountries: countBy(rs, (s) => s.country).slice(0, 12),
    topCities: countBy(rs, cityKey).slice(0, 10),
    sources: countBy(rs, (s) => s.refSource),
    devices: countBy(rs, (s) => s.device),
    browsers: countBy(rs, (s) => s.browser),
    os: countBy(rs, (s) => s.os),
    timeseries,
    recent,
  };
}

async function handleLogin(req, res) {
  const text = await readBody(req, 8192);
  const params = new URLSearchParams(text);
  const candidate = params.get('password') || '';
  const a = createHash('sha256').update(candidate).digest();
  const b = createHash('sha256').update(ADMIN_PASSWORD).digest();
  const ok = a.length === b.length && timingSafeEqual(a, b);
  if (!ok) {
    redirect(res, '/analytics/login?error=1');
    return;
  }
  const token = signToken({ exp: Date.now() + COOKIE_MAX_AGE * 1000 });
  redirect(res, '/analytics', { 'Set-Cookie': buildCookie(token) });
}

async function serveFile(req, res, relPath) {
  const file = path.normalize(path.join(PUBLIC_DIR, relPath));
  if (!file.startsWith(PUBLIC_DIR)) {
    json(req, res, 403, { error: 'forbidden' });
    return;
  }
  try {
    const content = await fs.readFile(file);
    respond(req, res, 200, content, { 'Content-Type': mime(file) });
  } catch {
    json(req, res, 404, { error: 'not found' });
  }
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const p = url.pathname;

  if (req.method === 'OPTIONS') {
    const origin = corsAllowed(req);
    respond(req, res, 204, null, {
      'Access-Control-Allow-Origin': origin || 'none',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    });
    return;
  }

  if (p === '/api/health' && req.method === 'GET') {
    json(req, res, 200, { ok: true });
    return;
  }

  if (p === '/api/track' && req.method === 'POST') {
    await handleTrack(req, res);
    return;
  }

  if (p === '/api/stats' && req.method === 'GET') {
    if (!isAuthed(req)) {
      json(req, res, 401, { error: 'unauthorized' });
      return;
    }
    const days = Number(url.searchParams.get('days') || 0);
    json(req, res, 200, computeStats(Number.isFinite(days) && days >= 0 ? Math.min(days, 3650) : 0));
    return;
  }

  if (p === '/analytics/login' && req.method === 'GET') {
    await serveFile(req, res, 'login.html');
    return;
  }
  if (p === '/analytics/login' && req.method === 'POST') {
    await handleLogin(req, res);
    return;
  }
  if (p === '/analytics/logout' && req.method === 'POST') {
    redirect(res, '/analytics/login', { 'Set-Cookie': clearCookie() });
    return;
  }
  if (p === '/analytics' || p === '/analytics/') {
    if (req.method !== 'GET') {
      json(req, res, 405, { error: 'method not allowed' });
      return;
    }
    if (!isAuthed(req)) {
      redirect(res, '/analytics/login');
      return;
    }
    await serveFile(req, res, 'dashboard.html');
    return;
  }
  if (p.startsWith('/analytics/assets/')) {
    await serveFile(req, res, p.replace(/^\/analytics\/assets\//, ''));
    return;
  }

  json(req, res, 404, { error: 'not found' });
}

const server = http.createServer((req, res) => {
  route(req, res).catch((err) => {
    console.error('[analytics]', err);
    json(req, res, 500, { error: 'internal' });
  });
});

async function shutdown() {
  await writeQueue;
  saveGeoCache();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

await initStorage();

if (!process.env.ANALYTICS_ADMIN_PASSWORD) {
  console.log(`[analytics] ANALYTICS_ADMIN_PASSWORD is not set. One-time random password for this run: ${ADMIN_PASSWORD}`);
  console.log('[analytics] Set ANALYTICS_ADMIN_PASSWORD (and ANALYTICS_SESSION_SECRET) in production.');
}

server.listen(PORT, HOST, () => {
  console.log(`[analytics] listening on http://${HOST}:${PORT}`);
  console.log(`[analytics] dashboard: http://localhost:${PORT}/analytics`);
  console.log(`[analytics] data dir: ${DATA_DIR}`);
});
