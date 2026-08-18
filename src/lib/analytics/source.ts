export function classifySource(referrer: string | undefined, siteOrigin: string | undefined): string {
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
