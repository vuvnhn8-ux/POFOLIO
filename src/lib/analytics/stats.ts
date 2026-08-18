import { ANALYTICS_CONFIG } from './config';
import { sessions, views, type Session } from './storage';

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeek(ts: number): number {
  const d = new Date(startOfDay(ts));
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.getTime();
}

function startOfMonth(ts: number): number {
  const d = new Date(ts);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function countBy(list: Session[] | { page: string }[], getter: (item: any) => string): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of list) {
    const k = getter(item) || 'Unknown';
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function uniqueCount(list: Session[]): number {
  return new Set(list.map((s) => s.cid || s.ipHash)).size;
}

export function computeStats(days: number) {
  const now = Date.now();
  const cutoff = days > 0 ? now - days * ANALYTICS_CONFIG.DAY_MS : 0;

  const inRange = (ts: number) => !cutoff || ts >= cutoff;
  const rs = [...sessions.values()].filter((s) => inRange(s.firstSeen));
  const rv = views.filter((v) => inRange(v.ts));

  const cityKey = (s: Session) => {
    const city = s.city || '';
    const country = s.country || '';
    if (city && country && country !== 'Unknown') return `${city}, ${country}`;
    return city || country || 'Unknown';
  };

  const today = startOfDay(now);
  const week = startOfWeek(now);
  const month = startOfMonth(now);
  const inRange2 = (s: Session, from: number) => s.firstSeen >= from;

  let bucketDays = days > 0 ? days : 30;
  if (days <= 0) {
    let earliest = now;
    for (const s of sessions.values()) earliest = Math.min(earliest, s.firstSeen);
    const span = Math.max(0, Math.ceil((now - earliest) / ANALYTICS_CONFIG.DAY_MS)) + 1;
    bucketDays = Math.min(180, Math.max(30, span));
  }

  const timeseries: { date: string; visitors: number; unique: number; pageviews: number }[] = [];
  for (let i = bucketDays - 1; i >= 0; i -= 1) {
    const dayStart = startOfDay(now - i * ANALYTICS_CONFIG.DAY_MS);
    const dayEnd = dayStart + ANALYTICS_CONFIG.DAY_MS;
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
    topCities: countBy(rs, (s: any) => cityKey(s)).slice(0, 10),
    sources: countBy(rs, (s) => s.refSource),
    devices: countBy(rs, (s) => s.device),
    browsers: countBy(rs, (s) => s.browser),
    os: countBy(rs, (s) => s.os),
    timeseries,
    recent,
  };
}
