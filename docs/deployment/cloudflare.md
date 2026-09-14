# Deployment — Cloudflare

Recommended global topology for `menu.foryxo.com`.

## DNS + CDN

1. Zone `foryxo.com` on Cloudflare; `menu` A/AAAA → VPS origin or Cloudflare Tunnel.
2. **Cache rules:** `Cache Everything` for `/menus/*` and `/_next/static/*` with
   `Edge TTL: respect origin` — the menu engine serves immutable read models with public
   cache headers, so publish-time revalidation is the only invalidation needed.
3. **Do not cache:** `/api/*`, `/dashboard/*`, `/admin/*`, `/login`, `/build`.
4. Enable Brotli, HTTP/3, and `Early Hints`.

## Object storage (R2)

1. Create bucket `foryxo-menu`; create an S3-compatible API token.
2. Set `STORAGE_PROVIDER=s3` plus `S3_*` env vars (see `docs/setup/production.md`).
3. Either serve media via the app's `/api/media/*` (validated, access-controlled) or bind a
   custom domain to the bucket for public images and set it as the storage public base URL.

## Security extras

- **WAF managed ruleset** on; rate-limit rule for `/api/auth/*` (e.g. 10 req/min/IP).
- **Turnstile** on contact/registration forms (wire server-side verification before enabling).
- Bot Fight Mode on; do not proxy `sandbox` subdomains used for payment testing.

## Cloudflare Tunnel (no open inbound ports)

```bash
cloudflared tunnel create foryxo-menu
cloudflared tunnel route dns foryxo-menu menu.foryxo.com
cloudflared tunnel run --url http://localhost:3000 foryxo-menu
```

This removes the need for public origin ports entirely; TLS terminates at the edge.

## Custom client domains

For `menu.ariacafe.ir`: add the domain to the Cloudflare zone as SaaS/custom-hostname
(SSL for SaaS) or create a per-client DNS record pointing at the origin and issue a
certificate. Verify ownership via CNAME + TXT before activating — see `docs/custom-domains.md`.
