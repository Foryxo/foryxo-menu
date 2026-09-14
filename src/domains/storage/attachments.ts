import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/domains/db/client";
import { media } from "@/domains/db/schema/index";
import { getStorage } from "@/domains/storage/index";

/** Resolve attachment IDs against the owning business; never trust client URLs. */
export async function resolveBusinessAttachments(businessId: string, ids: string[]) {
  if (new Set(ids).size !== ids.length) return null;
  const db = getDb();
  const rows = ids.length ? await db.select().from(media).where(and(
    inArray(media.id, ids),
    eq(media.businessId, businessId),
    eq(media.status, "active"),
  )) : [];
  if (rows.length !== ids.length) return null;
  const byId = new Map(rows.map((row) => [row.id, row]));
  const storage = getStorage();
  return ids.map((id) => {
    const row = byId.get(id)!;
    return { mediaId: id, url: storage.publicUrl(row.storageKey), filename: row.filename, mime: row.mime };
  });
}

/** Old stored records may contain user-supplied URLs; show only app media links. */
export function safeMediaUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value, "https://menu.foryxo.com");
    if (url.origin !== "https://menu.foryxo.com" || !url.pathname.startsWith("/api/media/")) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
