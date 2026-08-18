export function parseUA(ua: string | null | undefined): { device: string; browser: string; os: string } {
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
