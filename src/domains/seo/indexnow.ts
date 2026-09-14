/**
 * IndexNow (spec §46): optional, key-based submission of changed URLs.
 * Never spams unchanged URLs — callers pass only actually-changed paths.
 */
import { env } from "@/config/env";

export async function submitIndexNow(urls: string[]): Promise<{ ok: boolean; error?: string }> {
  if (!env.INDEXNOW_KEY) {
    return { ok: false, error: "indexnow_not_configured" };
  }
  if (urls.length === 0) return { ok: true };

  const host = new URL(env.APP_URL).host;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: env.INDEXNOW_KEY,
        keyLocation: `${env.APP_URL}/indexnow-key/${env.INDEXNOW_KEY}`,
        urlList: urls.map((u) => (u.startsWith("http") ? u : `${env.APP_URL}${u}`)),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok, error: res.ok ? undefined : `indexnow_http_${res.status}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
