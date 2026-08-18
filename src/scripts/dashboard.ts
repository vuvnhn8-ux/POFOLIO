(() => {
  const PALETTE = ['#6366f1', '#22d3ee', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#38bdf8', '#f472b6', '#94a3b8', '#c084fc', '#2dd4bf', '#fb923c'];

  const $ = (sel: string) => document.querySelector(sel);
  const esc = (s: any) => String(s ?? '').replace(/[&<>"']/g, (c: string) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
  const fmt = (n: any) => Number(n || 0).toLocaleString('en-US');
  const short = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));

  function fmtDuration(sec: number): string {
    if (!sec) return '<1s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m ? `${m}m ${s}s` : `${s}s`;
  }

  function fmtTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const SOURCE_CLASS: Record<string, string> = { direct: 'direct', google: 'google', linkedin: 'linkedin', facebook: 'facebook' };

  let currentDays = 30;

  async function loadStats(days: number): Promise<void> {
    const res = await fetch(`/api/stats?days=${days}`);
    if (res.status === 401) {
      window.location.href = '/analytics/login';
      return;
    }
    if (!res.ok) throw new Error('failed to load stats');
    const data = await res.json();
    currentDays = days;
    render(data);
  }

  function render(d: any): void {
    const set = (k: string, v: any) => { const node = $(`[data-k="${k}"]`); if (node) node.textContent = fmt(v); };

    set('visits', d.totals.visits);
    set('unique', d.totals.unique);
    set('pageviews', d.totals.pageviews);
    set('today', d.today.visits);
    set('week', d.week.visits);
    set('month', d.month.visits);

    renderList('topPages', d.topPages, (r: any) => `<tr><td>${esc(r.label)}</td><td>${fmt(r.value)}</td></tr>`);
    renderList('topCountries', d.topCountries, (r: any) => `<tr><td>${esc(r.label)}</td><td>${fmt(r.value)}</td></tr>`);
    renderList('topCities', d.topCities, (r: any) => `<tr><td>${esc(r.label)}</td><td>${fmt(r.value)}</td></tr>`);

    const recentHtml = d.recent.length
      ? d.recent.map((r: any) => `<tr>
          <td>${esc(fmtTime(r.time))}</td>
          <td>${esc(r.page)}</td>
          <td><span class="tag ${SOURCE_CLASS[r.source] || ''}">${esc(r.source)}</span></td>
          <td>${esc(r.country)}</td>
          <td>${esc(r.city || '—')}</td>
          <td>${esc(r.device)}</td>
          <td>${esc(r.browser)}</td>
          <td>${esc(r.os)}</td>
          <td>${esc(fmtDuration(r.duration))}</td>
          <td>${esc(r.screen || '—')}</td>
        </tr>`).join('')
      : '<tr><td colspan="10" class="empty">No visits recorded yet.</td></tr>';
    const recentBody = $('[data-list="recent"]');
    if (recentBody) recentBody.innerHTML = recentHtml;

    drawBars($('[data-chart="visitors"]') as HTMLCanvasElement, d.timeseries.map((t: any) => ({ label: t.date, value: t.visitors })), { day: true, showEvery: Math.ceil(d.timeseries.length / 8) });
    drawBars($('[data-chart="pageviews"]') as HTMLCanvasElement, d.timeseries.map((t: any) => ({ label: t.date, value: t.pageviews })), { day: true, showEvery: Math.ceil(d.timeseries.length / 8) });
    drawBars($('[data-chart="geo"]') as HTMLCanvasElement, d.topCountries.slice(0, 8));
    drawDonut($('[data-chart="sources"]') as HTMLCanvasElement, d.sources, 'sources');
    drawDonut($('[data-chart="devices"]') as HTMLCanvasElement, d.devices, 'devices');
    drawBars($('[data-chart="browsers"]') as HTMLCanvasElement, d.browsers.slice(0, 6));
    drawBars($('[data-chart="os"]') as HTMLCanvasElement, d.os.slice(0, 6));
  }

  function renderList(name: string, rows: any[], rowHtml: (r: any) => string): void {
    const body = $(`[data-list="${name}"]`);
    if (!body) return;
    body.innerHTML = rows.length
      ? rows.map(rowHtml).join('')
      : `<tr><td colspan="2" class="empty">No data yet.</td></tr>`;
  }

  function setupCanvas(canvas: HTMLCanvasElement | null): { ctx: CanvasRenderingContext2D; cssW: number; cssH: number } | null {
    if (!canvas) return null;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth;
    const cssH = canvas.clientHeight;
    if (!cssW || !cssH) return null;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    return { ctx, cssW, cssH };
  }

  function emptyState(ctx: CanvasRenderingContext2D, cssW: number, cssH: number): void {
    ctx.fillStyle = '#8b91ad';
    ctx.font = '13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('No data yet', cssW / 2, cssH / 2);
  }

  function drawBars(canvas: HTMLCanvasElement | null, data: { label: string; value: number }[], opts: { day?: boolean; showEvery?: number } = {}): void {
    const s = setupCanvas(canvas);
    if (!s) return;
    const { ctx, cssW, cssH } = s;
    if (!data.length) { emptyState(ctx, cssW, cssH); return; }

    const padL = 38;
    const padR = 6;
    const padT = 16;
    const padB = opts.showEvery ? 26 : 30;
    const max = Math.max(1, ...data.map((d) => d.value));
    const chartW = cssW - padL - padR;
    const chartH = cssH - padT - padB;
    const n = data.length;
    const slot = chartW / n;
    const barW = Math.max(2, Math.min(slot * 0.58, 40));

    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.strokeStyle = 'rgba(139,145,173,0.15)';
    ctx.fillStyle = '#8b91ad';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const ticks = 4;
    for (let i = 0; i <= ticks; i += 1) {
      const y = padT + chartH - (chartH * i) / ticks;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(cssW - padR, y);
      ctx.stroke();
      ctx.fillText(short((max * i) / ticks), padL - 6, y);
    }

    const showEvery = opts.showEvery || 1;
    data.forEach((d, i) => {
      const h = (d.value / max) * chartH;
      const x = padL + slot * i + (slot - barW) / 2;
      const y = padT + chartH - h;
      const grad = ctx.createLinearGradient(0, y, 0, padT + chartH);
      grad.addColorStop(0, PALETTE[i % PALETTE.length]);
      grad.addColorStop(1, PALETTE[(i + 2) % PALETTE.length]);
      ctx.fillStyle = grad;
      const r = Math.min(4, barW / 2);
      ctx.beginPath();
      ctx.roundRect(x, y, barW, Math.max(h, 1), r);
      ctx.fill();
      if (n <= 16) {
        ctx.fillStyle = '#e6e8f3';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(short(d.value), x + barW / 2, Math.max(y - 3, 2));
      }
      if (i % showEvery === 0 || i === n - 1) {
        ctx.fillStyle = '#8b91ad';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        const label = opts.day ? d.label.slice(5) : d.label;
        ctx.save();
        if (label.length > 6) {
          ctx.translate(x + barW / 2, padT + chartH + 8);
          ctx.rotate(-0.35);
          ctx.textAlign = 'right';
          ctx.fillText(label, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(label, x + barW / 2, padT + chartH + 8);
        }
      }
    });
  }

  function drawDonut(canvas: HTMLCanvasElement | null, data: { label: string; value: number }[], legendKey: string): void {
    const s = setupCanvas(canvas);
    if (!s) return;
    const { ctx, cssW, cssH } = s;
    const legend = $(`[data-legend="${legendKey}"]`);
    if (legend) {
      const total = data.reduce((a, b) => a + b.value, 0);
      legend.innerHTML = data.map((d, i) => `<li>
        <span class="swatch" style="background:${PALETTE[i % PALETTE.length]}"></span>
        <span class="legend-name">${esc(d.label)}</span>
        <span class="legend-value">${fmt(d.value)}${total ? ` (${Math.round((d.value / total) * 100)}%)` : ''}</span>
      </li>`).join('');
    }
    if (!data.length || !data.some((d) => d.value > 0)) { emptyState(ctx, cssW, cssH); return; }

    const total = data.reduce((a, b) => a + b.value, 0);
    const size = Math.min(cssW * 0.6, cssH - 12);
    const cx = size / 2 + 8;
    const cy = cssH / 2;
    const r = size / 2 - 14;
    let angle = -Math.PI / 2;
    ctx.lineWidth = Math.max(14, Math.min(26, r * 0.45));
    ctx.lineCap = 'butt';
    const gap = 0.03;
    data.forEach((d, i) => {
      const sweep = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, angle + gap, angle + sweep - gap);
      ctx.strokeStyle = PALETTE[i % PALETTE.length];
      ctx.stroke();
      angle += sweep;
    });
    ctx.fillStyle = '#e6e8f3';
    ctx.font = '700 20px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fmt(total), cx, cy - 6);
    ctx.fillStyle = '#8b91ad';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillText('total', cx, cy + 14);
  }

  document.querySelectorAll('[data-range]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-range]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const days = Number((btn as HTMLElement).dataset.range);
      loadStats(days).catch(() => {});
    });
  });

  const app = $('#app');
  if (app) app.hidden = false;
  loadStats(currentDays).catch(() => {});
  window.setInterval(() => {
    loadStats(currentDays).catch(() => {});
  }, 60000);
})();
