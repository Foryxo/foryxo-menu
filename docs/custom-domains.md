# Custom Domains

Default URL: `menu.foryxo.com/menus/{slug}/menu` (spec rule #1). Custom domains are optional.

## Supported patterns

| Pattern | Example | Feasibility |
| --- | --- | --- |
| Subdomain | `menu.ariacafe.ir` | Preferred — CNAME to `menu.foryxo.com`, own TLS cert |
| Path on existing site | `ariacafe.ir/menu` | Requires reverse proxy/iframe on the client's host; documented guide provided; not guaranteed |
| Apex/root | `ariacafe.ir` | Only if the client has no site; conflicts with their DNS; discouraged |

Never used: `{slug}.menu.foryxo.com` (explicitly excluded by spec §154-2).

## Workflow

1. Client chooses "I already own a domain" (or asks for help buying one) in the builder.
2. Foryxo issues instructions: CNAME `menu` → `menu.foryxo.com` (or A record to origin IP).
3. Client sets DNS; we verify via lookup of the expected record (verification job).
4. TLS: per-domain certificate (certbot on VPS) or Cloudflare for-SaaS custom hostname.
5. The `domain_instructions`, `domain_misconfigured`, and `ssl_active` message templates
   cover the client communication; domain status is tracked on the project.

## Ownership policy (spec §147)

- The customer is always the **legal domain owner**. When Foryxo assists with registration, we
  record registrar, owner, expiry and renewal responsibility in the project; the domain is
  registered under the client's identity.
- Foryxo never holds domains hostage: full transfer support on request; hosting cancellation
  never blocks DNS moves.
