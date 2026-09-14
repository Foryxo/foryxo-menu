# Deployment — VPS

Reference topology for a single strong VPS (4 vCPU / 8 GB) serving a few thousand menus.

```text
Internet → Nginx (TLS, gzip/brotli) → Node (next start) ×1..2
                                     ├→ PostgreSQL (managed or local)
                                     ├→ Redis (rate limit, BullMQ)
                                     └→ job worker (drain-jobs)
```

## Steps

1. **Node 20 LTS + PM2 or systemd**

```bash
npm ci && npm run build
pm2 start npm --name foryxo-web -- start
pm2 start npm --name foryxo-jobs -- run jobs:drain   # drain-jobs worker (see package.json)
pm2 save && pm2 startup
```

2. **Nginx server block**

```nginx
server {
  listen 443 ssl http2;
  server_name menu.foryxo.com;
  ssl_certificate     /etc/letsencrypt/live/menu.foryxo.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/menu.foryxo.com/privkey.pem;

  gzip on;
  gzip_types text/css application/javascript application/json image/svg+xml;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
  }
}
```

3. **Database** — Postgres 16+ with `scram-sha-256`; restrict to localhost/VPC; nightly dumps.
4. **Redis** — require auth (`requirepass`), bind to loopback/VPC only.
5. **Firewall** — expose 80/443 only; SSH via key + fail2ban.
6. **Zero-downtime updates** — `npm ci && npm run build && pm2 reload foryxo-web`.
7. **Migrations** — run `npm run db:migrate` and `npm run staff:bootstrap` during a deploy window; migrations are forward-only.
8. **Health check** — monitor `GET /api/health`; it returns 200 only when the app and database are reachable.

## Custom domains for clients

Point client CNAMEs (`menu.ariacafe.ir`) at this server; terminate TLS per-domain via
`certbot -d menu.ariacafe.ir` or a wildcard certificate. Domain setup is tracked per project —
see `docs/custom-domains.md`.
