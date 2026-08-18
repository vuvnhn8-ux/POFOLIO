import type { APIRoute } from 'astro';

export const prerender = false;
import { verifyToken } from '../../lib/analytics/crypto';
import { computeStats } from '../../lib/analytics/stats';
import { ensureInitialized } from '../../lib/analytics/init';

function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (key === name) return part.slice(idx + 1).trim();
  }
  return null;
}

export const GET: APIRoute = async ({ request }) => {
  await ensureInitialized();
  const token = getCookie(request, 'pa_session');
  if (!verifyToken(token)) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const days = Number(url.searchParams.get('days') || 0);
  const validDays = Number.isFinite(days) && days >= 0 ? Math.min(days, 3650) : 0;
  const stats = computeStats(validDays);

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
