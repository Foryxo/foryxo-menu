# Disaster Recovery

## Objectives

- **RPO 24h** (database), **RPO 1h** for uploads (R2 versioning), **RTO 4h** for full site;
  menus stay served from CDN cache during most outages (stale-while-error).

## Backups

| Data | Method | Schedule | Retention |
| --- | --- | --- | --- |
| Postgres | `pg_dump` custom format + WAL archiving | nightly + continuous WAL | 30 days |
| Uploads (R2) | bucket versioning | continuous | 90 days |
| Config/secrets | secret manager export | on change | versioned |

Restore target: fresh VPS + `pg_restore` + `npm ci && npm run build` + env restore + DNS flip.

## Runbooks

### Database loss
1. Provision Postgres; `pg_restore` latest dump + WAL to last transaction.
2. `npm run db:migrate` to confirm schema at head.
3. Bring app up; spot-check ledger invariants (sum of credits per account equals balance query).

### Region/zone loss
1. CDN serves cached menus (stale-while-error keeps them available).
2. Provision replacement origin; update DNS/Tunnel.
3. Restore DB from backup; redeploy app.

### Bad deploy
1. `pm2 reload` previous build artifact (keep last 3 builds on disk).
2. Or edge: temporarily cache-everything on `/menus/*` to shed origin load.

### Ledger corruption (suspected)
1. Freeze wallet operations (feature flag off).
2. Reconcile from append-only rows — ledger is the source of truth; identify the divergent entry.
3. Correcting entries only (never UPDATE/DELETE) — documented adjustment with audit row.

## Drills

Quarterly restore drill: restore staging from production backup, run migration check +
ledger invariant queries, time it. Record results in FINAL-AUDIT follow-ups.
