import type { APIRoute } from 'astro';
import { ANALYTICS_CONFIG } from '../../../lib/analytics/config';

function clearCookie(): string {
  let cookie = 'pa_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
  if (ANALYTICS_CONFIG.SECURE_COOKIE) cookie += '; Secure';
  return cookie;
}

export const POST: APIRoute = async () => {
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/analytics/login',
      'Set-Cookie': clearCookie(),
    },
  });
};
