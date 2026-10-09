import crypto from "node:crypto";

import { getSupabaseAdmin } from "@/integrations/supabase/client.server";

const STATE_BUCKET = "indexes-whatsapp-mcp-state";
const STATE_OBJECT = "state/current.bin";
const DOWNLOAD_TTL_SECONDS = 300;

function timingSafeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function verifyGowaStateAuthorization(request: Request): boolean {
  const rawCredential = process.env.GOWA_BASIC_AUTH?.trim();
  if (!rawCredential) return false;

  const expected = `Basic ${Buffer.from(rawCredential).toString("base64")}`;
  const actual = request.headers.get("authorization") ?? "";
  return timingSafeEqualText(actual, expected);
}

async function ensureStateBucket() {
  const admin = getSupabaseAdmin();
  const existing = await admin.storage.getBucket(STATE_BUCKET);
  if (existing.data) return admin;

  const created = await admin.storage.createBucket(STATE_BUCKET, {
    public: false,
    fileSizeLimit: "64MB",
    allowedMimeTypes: ["application/octet-stream"],
  });

  if (created.error) {
    const retry = await admin.storage.getBucket(STATE_BUCKET);
    if (!retry.data) {
      throw new Error("GOWA_STATE_BUCKET_UNAVAILABLE");
    }
  }

  return admin;
}

export async function createGowaStateUploadGrant() {
  const admin = await ensureStateBucket();
  const { data, error } = await admin.storage
    .from(STATE_BUCKET)
    .createSignedUploadUrl(STATE_OBJECT, { upsert: true });

  if (error || !data?.signedUrl) {
    throw new Error("GOWA_STATE_UPLOAD_GRANT_FAILED");
  }

  return {
    url: data.signedUrl,
    expiresIn: 7200,
  };
}

export async function createGowaStateDownloadGrant() {
  const admin = await ensureStateBucket();
  const { data, error } = await admin.storage
    .from(STATE_BUCKET)
    .createSignedUrl(STATE_OBJECT, DOWNLOAD_TTL_SECONDS, { download: true });

  if (error || !data?.signedUrl) {
    throw new Error("GOWA_STATE_DOWNLOAD_GRANT_FAILED");
  }

  return {
    url: data.signedUrl,
    expiresIn: DOWNLOAD_TTL_SECONDS,
  };
}
