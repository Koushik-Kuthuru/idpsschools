import type { SupabaseClient } from "@supabase/supabase-js";
import { withAdminRoute, noStoreJson } from "@/lib/adminRouteAuth";

const BUCKET = "uploads";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function isAllowedUpload(file: File) {
  const mime = (file.type || "").toLowerCase();
  if (mime.startsWith("image/")) return true;
  if (ALLOWED_MIME.has(mime)) return true;
  return /\.(pdf|jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
}

async function ensureUploadsBucket(admin: SupabaseClient) {
  const { error } = await admin.storage.getBucket(BUCKET);
  if (!error) return;
  const created = await admin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
    allowedMimeTypes: null, // allow common school docs + photos; validated in route
  });
  if (created.error && !/already exists|duplicate/i.test(created.error.message || "")) {
    throw new Error(created.error.message || "Failed to create uploads bucket");
  }
}

export const POST = withAdminRoute(async (req, ctx) => {
  try {
    const form = await req.formData();
    const file = form.get("file");
    let rawPath = String(form.get("path") ?? "").trim();

    if (!(file instanceof File)) {
      return noStoreJson({ error: "file required" }, { status: 400 });
    }
    if (!rawPath) {
      return noStoreJson({ error: "path required" }, { status: 400 });
    }
    if (rawPath.includes("..") || rawPath.startsWith("/")) {
      return noStoreJson({ error: "invalid path" }, { status: 400 });
    }
    if (file.size <= 0 || file.size > MAX_BYTES) {
      return noStoreJson({ error: "File must be between 1 byte and 10 MB" }, { status: 400 });
    }
    if (!isAllowedUpload(file)) {
      return noStoreJson({ error: "Only PDF and image uploads are allowed" }, { status: 400 });
    }

    const mime = (file.type || "").toLowerCase();
    const contentType = mime || guessMime(file.name) || "application/octet-stream";

    // Ensure storage object has a usable extension for browsers / CDN.
    if (!/\.[a-z0-9]+$/i.test(rawPath)) {
      rawPath = `${rawPath}${extensionFor(contentType, file.name)}`;
    }

    await ensureUploadsBucket(ctx.admin);

    // Keep bucket mime list permissive for photos taken from phones.
    await ctx.admin.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: null,
    }).catch(() => undefined);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const { error: uploadError } = await ctx.admin.storage.from(BUCKET).upload(rawPath, bytes, {
      contentType,
      upsert: true,
    });
    if (uploadError) {
      return noStoreJson({ error: uploadError.message }, { status: 500 });
    }

    const { data } = ctx.admin.storage.from(BUCKET).getPublicUrl(rawPath);
    return noStoreJson({
      path: rawPath,
      publicUrl: data.publicUrl,
      fileName: file.name,
      contentType,
      size: file.size,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return noStoreJson({ error: message }, { status: 500 });
  }
});

function guessMime(name: string) {
  if (/\.pdf$/i.test(name)) return "application/pdf";
  if (/\.png$/i.test(name)) return "image/png";
  if (/\.webp$/i.test(name)) return "image/webp";
  if (/\.gif$/i.test(name)) return "image/gif";
  if (/\.heic$/i.test(name)) return "image/heic";
  if (/\.heif$/i.test(name)) return "image/heif";
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  return "";
}

function extensionFor(contentType: string, fileName: string) {
  const fromName = fileName.match(/(\.[a-z0-9]+)$/i)?.[1];
  if (fromName) return fromName.toLowerCase();
  if (contentType === "application/pdf") return ".pdf";
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/gif") return ".gif";
  if (contentType === "image/heic") return ".heic";
  if (contentType === "image/heif") return ".heif";
  if (contentType.startsWith("image/")) return ".jpg";
  return "";
}
