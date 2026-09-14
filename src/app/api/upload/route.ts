/**
 * Upload endpoint (spec §23, §50): authenticated business users upload
 * logos/photos/documents. Validation: size, MIME, magic bytes, filename.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/domains/db/client";

const db = getDb();
import { media, businessMembers, projectFiles, projects } from "@/domains/db/schema/index";
import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/domains/auth/server";
import {
  getStorage,
  buildStorageKey,
  validateUpload,
  UploadValidationError,
} from "@/domains/storage/index";
import { ipRateLimit } from "@/domains/auth/security";
import { audit } from "@/domains/audit/log";
import { sanitizeNote } from "@/lib/utils";

const ALLOWED_KINDS = new Set(["food_photo", "photos", "logo", "menu_doc", "spreadsheet", "quote_attachment", "chat_attachment", "other"]);

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
  // A named menu-photo batch can legitimately contain dozens of dishes.
  const rl = await ipRateLimit(ip, "upload", 100, 3600);
  if (!rl.allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const session = await auth.api.getSession({ headers: req.headers });
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const file = form.get("file");
  const businessId = String(form.get("businessId") ?? "");
  const requestedKind = String(form.get("kind") ?? "other");
  const kind = ALLOWED_KINDS.has(requestedKind) ? requestedKind : "other";
  const label = sanitizeNote(String(form.get("label") ?? ""), 120);
  const customerNotes = sanitizeNote(String(form.get("customerNotes") ?? ""), 1000);

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "no_file" }, { status: 400 });
  }
  if (!businessId) {
    return NextResponse.json({ error: "missing_business" }, { status: 400 });
  }

  // TENANT AUTHORIZATION: caller must be a member of businessId.
  const membership = (
    await db
      .select()
      .from(businessMembers)
      .where(
        and(
          eq(businessMembers.businessId, businessId),
          eq(businessMembers.userId, session.user.id),
        ),
      )
      .limit(1)
  )[0];
  const isAdmin = ["superadmin", "creator", "admin", "editor"].includes(
    (session.user as { role?: string }).role ?? "",
  );
  if (!membership && !isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let mime: string;
  try {
    mime = validateUpload(buf, file.type || "application/octet-stream", file.name);
  } catch (e) {
    if (e instanceof UploadValidationError) {
      return NextResponse.json({ error: e.message }, { status: 415 });
    }
    throw e;
  }
  if (kind === "food_photo" && !mime.startsWith("image/")) {
    return NextResponse.json({ error: "food_photo_requires_image" }, { status: 415 });
  }
  if (kind === "food_photo" && !label) {
    return NextResponse.json({ error: "dish_name_required" }, { status: 422 });
  }

  const storage = getStorage();
  const key = buildStorageKey(businessId, file.name);
  const stored = await storage.put(key, buf, mime);

  const [row] = await db
    .insert(media)
    .values({
      id: crypto.randomUUID(),
      businessId,
      uploadedBy: session.user.id,
      kind,
      filename: file.name.slice(0, 180),
      label: label || null,
      customerNotes: customerNotes || null,
      workflowStatus: "received",
      mime: stored.mime,
      size: stored.size,
      hash: stored.hash,
      storageKey: stored.key,
    })
    .returning();

  // Keep uploaded assets attached to the active build without asking customers
  // to understand project IDs. The creator can still see unlinked assets by business.
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.businessId, businessId))
    .orderBy(desc(projects.createdAt))
    .limit(1);
  if (project) {
    await db.insert(projectFiles).values({
      id: crypto.randomUUID(),
      projectId: project.id,
      mediaId: row.id,
      kind,
      uploadedBy: session.user.id,
    });
  }

  await audit.log({
    actorUserId: session.user.id,
    action: "media.upload",
    targetType: "media",
    targetId: row.id,
    businessId,
  });

  return NextResponse.json({
    ok: true,
    mediaId: row.id,
    url: storage.publicUrl(stored.key),
    hash: stored.hash,
    label: row.label,
    workflowStatus: row.workflowStatus,
  });
}
