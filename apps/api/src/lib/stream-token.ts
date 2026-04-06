import { createHmac, timingSafeEqual } from "node:crypto";

import type { UserProfile } from "@school-bus/shared";

import { HttpError } from "./http.js";

type StreamTokenPayload = {
  userId: string;
  role: UserProfile["role"];
  schoolId: string;
  tripId?: string;
  issuedAt: string;
  expiresAt: string;
};

function readSecret() {
  const value = process.env.STREAM_TOKEN_SECRET?.trim();
  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "test") {
    return "test-stream-token-secret";
  }

  throw new HttpError(500, "Missing STREAM_TOKEN_SECRET", "missing_stream_token_secret");
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string) {
  return createHmac("sha256", readSecret()).update(encodedPayload).digest("base64url");
}

function parseIso(iso: string) {
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(401, "Invalid stream token timestamp", "invalid_stream_token");
  }

  return parsed;
}

export function issueStreamToken(input: {
  actor: UserProfile;
  schoolId?: string;
  tripId?: string;
}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);
  const payload: StreamTokenPayload = {
    userId: input.actor.id,
    role: input.actor.role,
    schoolId: input.schoolId ?? input.actor.schoolId,
    tripId: input.tripId,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return {
    streamToken: `${encodedPayload}.${signature}`,
    expiresAt: payload.expiresAt
  };
}

export function verifyStreamToken(rawToken: string) {
  const token = rawToken.trim();
  if (!token) {
    throw new HttpError(401, "Missing stream token", "missing_stream_token");
  }

  const [encodedPayload, receivedSignature] = token.split(".");
  if (!encodedPayload || !receivedSignature) {
    throw new HttpError(401, "Malformed stream token", "invalid_stream_token");
  }

  const expectedSignature = sign(encodedPayload);
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(receivedSignature, "utf8");
  if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
    throw new HttpError(401, "Invalid stream token signature", "invalid_stream_token");
  }

  let payload: StreamTokenPayload;
  try {
    payload = JSON.parse(base64UrlDecode(encodedPayload)) as StreamTokenPayload;
  } catch {
    throw new HttpError(401, "Invalid stream token payload", "invalid_stream_token");
  }

  const expiresAt = parseIso(payload.expiresAt);
  if (Date.now() >= expiresAt) {
    throw new HttpError(401, "Stream token expired", "expired_stream_token");
  }

  return payload;
}
