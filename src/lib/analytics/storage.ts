import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ANALYTICS_CONFIG } from './config';
import { loadGeoCache } from './geo';

export interface Session {
  sid: string;
  cid: string;
  ipHash: string;
  country: string;
  region: string;
  city: string;
  tz: string;
  lang: string;
  screen: string;
  device: string;
  browser: string;
  os: string;
  refSource: string;
  ref: string;
  landing: string;
  exit: string;
  firstSeen: number;
  lastSeen: number;
}

export interface PageView {
  sid: string;
  page: string;
  ts: number;
}

export const sessions = new Map<string, Session>();
export const views: PageView[] = [];
let writeQueue: Promise<void> = Promise.resolve();

function appendLine(file: string, record: Record<string, unknown>): void {
  const line = `${JSON.stringify(record)}\n`;
  writeQueue = writeQueue.then(() => fs.appendFile(path.join(ANALYTICS_CONFIG.DATA_DIR, file), line, 'utf8')).catch(() => {});
}

export function upsertSession(s: Session): void {
  sessions.set(s.sid, s);
  appendLine('sessions.jsonl', s as unknown as Record<string, unknown>);
}

export function addView(v: PageView): void {
  views.push(v);
  appendLine('pageviews.jsonl', v as unknown as Record<string, unknown>);
}

export async function initStorage(): Promise<void> {
  await fs.mkdir(ANALYTICS_CONFIG.DATA_DIR, { recursive: true });
  await loadGeoCache();

  const loadLines = async (file: string): Promise<Record<string, unknown>[]> => {
    const out: Record<string, unknown>[] = [];
    try {
      const text = await fs.readFile(path.join(ANALYTICS_CONFIG.DATA_DIR, file), 'utf8');
      for (const line of text.split('\n')) {
        if (!line.trim()) continue;
        try { out.push(JSON.parse(line)); } catch { /* skip corrupt line */ }
      }
    } catch { /* file absent on first run */ }
    return out;
  };

  const cutoff = Date.now() - ANALYTICS_CONFIG.RETENTION_DAYS * ANALYTICS_CONFIG.DAY_MS;
  let changed = false;
  for (const s of await loadLines('sessions.jsonl')) {
    if (s.sid && s.firstSeen && (s.firstSeen as number) >= cutoff) sessions.set(s.sid as string, s as unknown as Session);
    else changed = true;
  }
  for (const v of await loadLines('pageviews.jsonl')) {
    if (v && v.ts && (v.ts as number) >= cutoff) views.push(v as unknown as PageView);
    else changed = true;
  }
  if (changed) compact();
}

export function compact(): void {
  const lines = [...sessions.values()].map((s) => JSON.stringify(s)).join('\n');
  writeQueue = writeQueue.then(async () => {
    await fs.writeFile(path.join(ANALYTICS_CONFIG.DATA_DIR, 'sessions.jsonl'), lines, 'utf8');
    await fs.writeFile(path.join(ANALYTICS_CONFIG.DATA_DIR, 'pageviews.jsonl'),
      views.map((v) => JSON.stringify(v)).join('\n'), 'utf8');
  }).catch(() => {});
}

export async function flushStorage(): Promise<void> {
  await writeQueue;
}
