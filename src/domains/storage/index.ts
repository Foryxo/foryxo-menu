/**
 * Object storage abstraction (spec §2): local (dev) or S3-compatible (R2 prod).
 * Uploads validated before persistence (spec §50).
 */
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { env } from "@/config/env";
import { randomId } from "@/lib/utils";

export const ALLOWED_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif",
  "application/pdf", "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "video/mp4",
]);

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25MB

export interface StoredObject {
  key: string;
  size: number;
  mime: string;
  hash: string;
}

export class UploadValidationError extends Error {}

/** Magic-byte sniffing (lightweight; full AV scanning is a pluggable job). */
function sniffMime(buf: Buffer, fallback: string): string {
  if (buf.length > 3) {
    if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
    if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
    if (buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "image/webp";
    if (buf.slice(0, 4).toString() === "%PDF") return "application/pdf";
  }
  return fallback;
}

export function validateUpload(buf: Buffer, declaredMime: string, filename: string): string {
  if (buf.length === 0) throw new UploadValidationError("empty_file");
  if (buf.length > MAX_UPLOAD_BYTES) throw new UploadValidationError("file_too_large");
  const mime = sniffMime(buf, declaredMime);
  if (!ALLOWED_MIME.has(mime)) throw new UploadValidationError(`disallowed_type:${mime}`);
  // Safe filename: strip path components & dangerous chars
  if (/[\\/]/.test(filename) || filename.includes("..")) throw new UploadValidationError("unsafe_filename");
  return mime;
}

export interface StorageAdapter {
  readonly name: string;
  put(key: string, buf: Buffer, mime: string): Promise<StoredObject>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
  publicUrl(key: string): string;
}

class LocalStorage implements StorageAdapter {
  readonly name = "local";
  private dir = resolve(/* turbopackIgnore: true */ process.cwd(), env.STORAGE_LOCAL_DIR);

  private fullPath(key: string): string {
    const safe = key.replace(/\\/g, "/").split("/").filter((s) => s && s !== "." && s !== "..").join("/");
    return join(this.dir, safe);
  }

  async put(key: string, buf: Buffer, mime: string): Promise<StoredObject> {
    const fp = this.fullPath(key);
    mkdirSync(fp.slice(0, fp.lastIndexOf("/")), { recursive: true });
    writeFileSync(fp, buf);
    return {
      key,
      size: buf.length,
      mime,
      hash: createHash("sha256").update(buf).digest("hex").slice(0, 32),
    };
  }
  async get(key: string): Promise<Buffer | null> {
    const fp = this.fullPath(key);
    return existsSync(fp) ? readFileSync(fp) : null;
  }
  async delete(key: string): Promise<void> {
    const fp = this.fullPath(key);
    if (existsSync(fp)) unlinkSync(fp);
  }
  publicUrl(key: string): string {
    return `/api/media/${key}`;
  }
}

class S3Storage implements StorageAdapter {
  readonly name = "s3";

  private async client() {
    const { S3Client } = await import("@aws-sdk/client-s3");
    return new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: Boolean(env.S3_ENDPOINT),
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID!,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
      },
    });
  }

  async put(key: string, buf: Buffer, mime: string): Promise<StoredObject> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: buf,
        ContentType: mime,
      }),
    );
    return {
      key,
      size: buf.length,
      mime,
      hash: createHash("sha256").update(buf).digest("hex").slice(0, 32),
    };
  }
  async get(key: string): Promise<Buffer | null> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    try {
      const res = await client.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
      return Buffer.from(await res.Body!.transformToByteArray());
    } catch {
      return null;
    }
  }
  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.client();
    await client.send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: key }));
  }
  publicUrl(key: string): string {
    return `/api/media/${key}`;
  }
}

export function getStorage(): StorageAdapter {
  return env.STORAGE_PROVIDER === "s3" && env.S3_BUCKET ? new S3Storage() : new LocalStorage();
}

/** Build a safe storage key with date sharding. */
export function buildStorageKey(businessId: string, filename: string): string {
  const ext = filename.includes(".") ? filename.split(".").pop()!.toLowerCase().slice(0, 8) : "bin";
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  return `u/${businessId}/${date}/${randomId(10)}.${ext}`;
}
