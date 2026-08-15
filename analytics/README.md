# polofio-analytics

Privacy-friendly visitor analytics + private dashboard for the portfolio.
Zero runtime dependencies — a single Node.js server (`server.js`, Node 18+) with file-based storage.

The portfolio (Astro) stays fully static and unchanged; it only fires anonymous
events to this server from a tiny client script.

## Architecture

```
browser ──(POST /api/track, fire-and-forget)──▶ analytics/server.js ──▶ data/*.jsonl
   │                                               │   │
   └──(browse /analytics, cookie auth)─────────────┘   └─ ipwho.is (geolocation, cached)
```

## Data model (append-only NDJSON)

`sessions.jsonl` — one object per visit/session:

| field | description |
| --- | --- |
| `sid` | anonymous session id (UUID, client-generated per page load) |
| `cid` | anonymous visitor id (UUID in `localStorage`, shared across sessions) |
| `ipHash` | salted SHA-256 of the IP, truncated — never stores the raw IP |
| `country` / `region` / `city` | approximate location from ipwho.is (fallback "Unknown") |
| `tz` / `lang` / `screen` | timezone, language, screen size |
| `device` / `browser` / `os` | parsed from the User-Agent header |
| `refSource` | google \| linkedin \| facebook \| direct \| other \| internal |
| `ref` | trimmed referrer URL |
| `landing` / `exit` | first and last page |
| `firstSeen` / `lastSeen` | start and last-activity timestamp (duration = difference) |

`pageviews.jsonl` — one object per page view: `{ sid, page, ts }`.

`geo-cache.json` — keyed by `ipHash` only; avoids re-querying the geo API.

Sessions are upserted in memory; heartbeats/exit events only update `lastSeen`.
`firstSeen` is never rewritten, so a reload cannot create a duplicate visit.

## Running

```sh
cd analytics
npm install   # no-op, zero deps
npm start     # requires ANALYTICS_ADMIN_PASSWORD (else a one-time password is printed)
```

Dev default endpoint baked into the static build is `http://localhost:8787`.
To point the portfolio at a production analytics URL, set at build time:

```sh
PUBLIC_ANALYTICS_URL=https://analytics.your-domain.com npm run build
```

## Environment variables

See `.env.example`. Important ones:

| var | purpose |
| --- | --- |
| `ANALYTICS_ADMIN_PASSWORD` | password for the private dashboard (required in prod) |
| `ANALYTICS_SESSION_SECRET` | cookie-signing + IP-hashing salt; set a stable random value |
| `ANALYTICS_ALLOWED_ORIGINS` | CORS allow-list for the tracking endpoint (default `*`) |
| `ANALYTICS_TRUST_PROXY` | `1` if behind a reverse proxy (uses `X-Forwarded-For`) |
| `ANALYTICS_GEO_MODE` | `auto` or `none` |
| `ANALYTICS_RETENTION_DAYS` | prune older sessions on startup (default 365) |
| `ANALYTICS_SECURE_COOKIE` | `1` to require HTTPS cookies |
| `PORT` / `HOST` | bind address (default `8787` / `0.0.0.0`) |

## Dashboard

- `GET /analytics` — private dashboard (redirects to login when unauthenticated)
- `POST /analytics/login` — password login, sets an HMAC-signed, HttpOnly, SameSite=Lax cookie (7 days)
- `GET /api/stats?days=7|30|90|0` — JSON stats behind the same auth

Charts are rendered client-side with plain Canvas — no third-party scripts, fonts or CDNs.

## Deploying

1. Run the static site as before (`npm run build && npm run preview`, or your static host).
2. Run the analytics server as a service (e.g. systemd unit, PM2, or Docker), with the env vars above.
3. Put HTTPS in front of it (Caddy/Nginx/Cloudflare) so dashboard cookies can be `Secure`.
4. Rebuild the portfolio with `PUBLIC_ANALYTICS_URL=https://analytics.example.com`.

Only the tracking endpoint needs to be reachable from the public site; the dashboard
is protected by the password and should not be linked anywhere.

## Privacy

- No cookies are set on visitors (the `pa_cid` value is `localStorage`, not a cookie).
- Raw IPs are never stored — only a salted hash, used purely to deduplicate when
  `localStorage` is unavailable. No fingerprinting.
- Referrer, language, timezone and screen size are kept minimal and only for the listed metrics.
- Dashboard credentials are verified against an env var; no password is ever stored.
