# Geographic location normalization

Foryxo uses ISO-standard location identifiers internally:

- Country: ISO 3166-1 alpha-2 uppercase code, such as `IR` or `DE`.
- Language: ISO 639-1 lowercase code, such as `fa` or `en`.
- Localized country labels: generated with `Intl.DisplayNames`; labels are presentation data, not identifiers.

At the edge, country detection accepts only deployment-provided headers. Cloudflare's `CF-IPCountry` is preferred and Vercel's `x-vercel-ip-country` is a fallback. The value controls whether Iranian SMS is offered, but it does not replace server-side OTP limits or provider validation.

## LinkedIn Bing Geo reference

LinkedIn's standardized Geo API is a LinkedIn-specific Bing Geo taxonomy. It resolves LinkedIn geo IDs to localized names and requires LinkedIn authorization plus its API protocol headers. Foryxo therefore does not use it as an IP-geolocation service.

If LinkedIn integration is added later, store its proprietary geo ID as an optional external reference while keeping the ISO country/language codes as Foryxo's canonical model. This avoids coupling account access and restaurant addresses to a third-party taxonomy.

Reference: <https://learn.microsoft.com/en-us/linkedin/shared/references/v2/standardized-data/locations/geo>
