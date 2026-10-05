/**
 * Media serving. Objects are served through the app in local mode;
 * in production with R2+CDN, publicUrl points to CDN and this route
 * remains the authenticated fallback.
 */
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, or } from "drizzle-orm";
import { auth } from "@/domains/auth/server";
import { getDb } from "@/domains/db/client";
import { businessMembers, businesses, media, menus, productImages, products } from "@/domains/db/schema/index";
import { getStorage } from "@/domains/storage/index";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key } = await ctx.params;
  const requestedKey = key.join("/");
  // Basic key validation: no traversal
  if (requestedKey.includes("..")) {
    return new NextResponse("bad request", { status: 400 });
  }
  const db = getDb();
  const [asset] = await db
    .select()
    .from(media)
    .where(or(eq(media.id, requestedKey), eq(media.storageKey, requestedKey)))
    .limit(1);
  // Pending objects remain quarantined for everyone, including staff. Raster
  // uploads become clean after server-side re-encoding; other types require a
  // scanner to explicitly mark them clean before they can be downloaded.
  if (!asset || asset.status !== "active" || asset.scanStatus !== "clean") {
    return new NextResponse("not found", { status: 404 });
  }

  // Only clean assets that are part of the current published menu (or its
  // business logo) are public. Menu documents and conversation attachments
  // always require tenant/staff authorization even when their URL leaks.
  let isPublic = false;
  {
    const [primaryImage, galleryImage, publicLogo] = await Promise.all([
      db.select({ id: products.id }).from(products).innerJoin(menus, and(
        eq(products.menuId, menus.id),
        eq(products.versionId, menus.publishedVersionId),
      )).where(and(eq(products.imageMediaId, asset.id), eq(products.isHidden, false), eq(menus.status, "published"))).limit(1),
      db.select({ id: productImages.id }).from(productImages)
        .innerJoin(products, eq(productImages.productId, products.id))
        .innerJoin(menus, and(eq(products.menuId, menus.id), eq(products.versionId, menus.publishedVersionId)))
        .where(and(eq(productImages.mediaId, asset.id), eq(products.isHidden, false), eq(menus.status, "published"))).limit(1),
      db.select({ id: businesses.id }).from(businesses)
        .innerJoin(menus, eq(menus.businessId, businesses.id))
        .where(and(eq(businesses.logoMediaId, asset.id), eq(menus.status, "published"))).limit(1),
    ]);
    isPublic = Boolean(primaryImage[0] || galleryImage[0] || publicLogo[0]);
  }

  if (!isPublic) {
    const session = await auth.api.getSession({ headers: req.headers }).catch(() => null);
    if (!session?.user) return new NextResponse("not found", { status: 404 });
    const role = (session.user as { role?: string }).role ?? "";
    const isStaff = ["superadmin", "creator", "admin", "finance", "support", "editor"].includes(role);
    const membership = asset.businessId
      ? (await db.select({ id: businessMembers.id }).from(businessMembers).where(and(
          eq(businessMembers.businessId, asset.businessId),
          eq(businessMembers.userId, session.user.id),
        )).limit(1))[0]
      : null;
    if (!isStaff && !membership) return new NextResponse("not found", { status: 404 });
  }

  const storageKey = asset.storageKey;
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
      "Cache-Control": isPublic ? "public, max-age=31536000, immutable" : "private, no-store",
    },
  });
}
