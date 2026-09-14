/**
 * Media serving. Objects are served through the app in local mode;
 * in production with R2+CDN, publicUrl points to CDN and this route
 * remains the authenticated fallback.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getStorage } from "@/domains/storage/index";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key } = await ctx.params;
  const storageKey = key.join("/");
  // Basic key validation: no traversal
  if (storageKey.includes("..")) {
    return new NextResponse("bad request", { status: 400 });
  }
  const storage = getStorage();
  const buf = await storage.get(storageKey);
  if (!buf) return new NextResponse("not found", { status: 404 });

  const ext = storageKey.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    webp: "image/webp", avif: "image/avif", gif: "image/gif",
    pdf: "application/pdf", csv: "text/csv", mp4: "video/mp4",
  };
  const mime = mimeMap[ext ?? ""] ?? "application/octet-stream";
  // Never render uploads as HTML; force safe types only.
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": mime,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
