import type { APIRoute } from 'astro';
import { timingSafeEqual } from 'node:crypto';
import { hashPassword, signToken } from '../../../lib/analytics/crypto';
import { ANALYTICS_CONFIG } from '../../../lib/analytics/config';

function buildCookie(token: string): string {
  let cookie = `pa_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ANALYTICS_CONFIG.COOKIE_MAX_AGE}`;
  if (ANALYTICS_CONFIG.SECURE_COOKIE) cookie += '; Secure';
  return cookie;
}

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();
  const candidate = String(formData.get('password') || '');

  const a = hashPassword(candidate);
  const b = hashPassword(ANALYTICS_CONFIG.ADMIN_PASSWORD);
  const ok = a.length === b.length && timingSafeEqual(a, b);

  if (!ok) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/analytics/login?error=1' },
    });
  }

  const token = signToken({ exp: Date.now() + ANALYTICS_CONFIG.COOKIE_MAX_AGE * 1000 });

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/analytics',
      'Set-Cookie': buildCookie(token),
    },
  });
};
