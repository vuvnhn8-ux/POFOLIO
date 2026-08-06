import { ui, type Lang } from '../i18n/ui';

const STORAGE_KEY = 'portfolio-lang';

function getByPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function applyLang(lang: Lang) {
  const dict = ui[lang];
  document.documentElement.lang = lang === 'ja' ? 'ja' : lang === 'vi' ? 'vi' : 'en';
  document.documentElement.setAttribute('data-lang', lang);

  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    const value = getByPath(dict, key);
    if (typeof value === 'string') {
      el.textContent = value;
    }
  });

  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (!key) return;
    const value = getByPath(dict, key);
    if (typeof value === 'string') {
      el.setAttribute('aria-label', value);
    }
  });

  document.querySelectorAll<HTMLImageElement>('[data-i18n-alt]').forEach((el) => {
    const key = el.getAttribute('data-i18n-alt');
    if (!key) return;
    const value = getByPath(dict, key);
    if (typeof value === 'string') {
      el.alt = value;
    }
  });


  const title = getByPath(dict, 'meta.title');
  if (typeof title === 'string') document.title = title;

  const desc = getByPath(dict, 'meta.description');
  if (typeof desc === 'string') {
    document.querySelector('meta[name="description"]')?.setAttribute('content', desc);
    document.querySelector('meta[property="og:description"]')?.setAttribute('content', desc);
  }
  if (typeof title === 'string') {
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', title);
  }

  document.querySelectorAll<HTMLButtonElement>('[data-lang-set]').forEach((btn) => {
    const active = btn.getAttribute('data-lang-set') === lang;
    btn.setAttribute('data-active', String(active));
    btn.setAttribute('aria-pressed', String(active));
  });

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
}

function init() {
  let initial: Lang = 'en';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'ja' || saved === 'vi') initial = saved;
  } catch {
    /* ignore */
  }

  applyLang(initial);

  document.querySelectorAll<HTMLButtonElement>('[data-lang-set]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang-set') as Lang | null;
      if (lang === 'en' || lang === 'ja' || lang === 'vi') applyLang(lang);
    });
  });
}

init();
