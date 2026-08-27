// Lightweight, privacy-conscious visitor tracking for the portfolio.
// Fires-and-forgets events to the analytics server. Never blocks or
// breaks the page: every failure path is swallowed silently.
//
// Production default is the deployed analytics server. For local dev,
// override it: PUBLIC_ANALYTICS_URL=http://localhost:8787 npm run dev

const ENDPOINT = (import.meta.env.PUBLIC_ANALYTICS_URL as string | undefined) || 'https://analytics.hoangvuvan.xyz';

const HEARTBEAT_MS = 30_000;
const CID_KEY = 'pa_cid';

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      /* fall through to manual uuid */
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function cid(): string {
  try {
    const existing = localStorage.getItem(CID_KEY);
    if (existing) return existing.slice(0, 64);
    const fresh = uuid();
    localStorage.setItem(CID_KEY, fresh);
    return fresh;
  } catch {
    return uuid();
  }
}

const session = {
  sid: uuid(),
  cid: cid(),
  start: Date.now(),
  ref: document.referrer || '',
  origin: window.location.origin,
  lang: (navigator.language || '').slice(0, 32),
  tz: '',
  screen: '',
};

try {
  session.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
} catch {
  /* ignore */
}
try {
  session.screen = `${window.screen.width}x${window.screen.height}`;
} catch {
  /* ignore */
}

let page = window.location.pathname + window.location.search;
let sessionSent = false;
let exitSent = false;

function track(event: string, extra: Record<string, unknown> = {}): void {
  if (event === 'session') {
    if (sessionSent) return;
    sessionSent = true;
  }
  if (event === 'exit') {
    if (exitSent) return;
    exitSent = true;
  }
  try {
    const body = JSON.stringify({
      event,
      sid: session.sid,
      cid: session.cid,
      page,
      ref: session.ref.slice(0, 500),
      origin: session.origin,
      start: session.start,
      now: Date.now(),
      screen: session.screen,
      tz: session.tz,
      lang: session.lang,
      ...extra,
    });
    const url = `${ENDPOINT}/api/track`;
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      navigator.sendBeacon(url, new Blob([body], { type: 'text/plain' }));
    } else {
      fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        mode: 'cors',
      }).catch(() => {});
    }
  } catch {
    /* analytics must never break the site */
  }
}

function maybeView(): void {
  const next = window.location.pathname + window.location.search;
  if (next === page) return;
  page = next;
  track('view', { page });
}

window.addEventListener('popstate', maybeView);
document.addEventListener('click', (e) => {
  const target = e.target as Element | null;
  const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!anchor) return;
  try {
    const url = new URL(anchor.getAttribute('href') || '', window.location.href);
    if (url.origin !== window.location.origin) return;
    const next = url.pathname + url.search;
    if (next === page) return;
    page = next;
    track('view', { page });
  } catch {
    /* ignore */
  }
});

function onExit(): void {
  track('exit', { dur: Date.now() - session.start });
}

let lastClick: { label: string; ts: number } = { label: '', ts: 0 };
document.addEventListener('click', (e) => {
  const target = e.target as Element | null;
  const el = target?.closest?.('a[href],button,[data-pa]') as Element | null;
  if (!el) return;
  let label = el.getAttribute('data-pa') || '';
  if (!label) {
    const text = (el.textContent || '').trim().replace(/\s+/g, ' ');
    if (el.tagName === 'A') label = text || el.getAttribute('href') || '';
    else label = text || 'button';
  }
  label = String(label).slice(0, 120);
  if (!label) return;
  const nowTs = Date.now();
  if (label === lastClick.label && nowTs - lastClick.ts < 500) return;
  lastClick = { label, ts: nowTs };
  track('click', { page, label });
});

window.setInterval(() => track('heartbeat'), HEARTBEAT_MS);
window.addEventListener('pagehide', onExit);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') onExit();
});

track('session');
