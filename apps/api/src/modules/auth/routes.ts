import { Router, type Router as ExpressRouter } from "express";
import { createHash, randomInt } from "node:crypto";

import type { AuthSessionResponse, StreamTokenResponse } from "@school-bus/shared";

import { asyncHandler, HttpError } from "../../lib/http.js";
import { buildForgotPasswordEmailHtml, buildForgotPasswordOtpEmailHtml, buildVerificationEmailHtml, buildWelcomeEmailHtml } from "../../lib/email/templates.js";
import { sendBrevoEmail } from "../../lib/email/brevo.js";
import { otpSendSchema, otpVerifySchema, forgotPasswordSchema, emailVerificationSchema, streamTokenRequestSchema, emailLoginSchema, parentForgotPasswordOtpSendSchema, parentForgotPasswordOtpVerifySchema } from "../../lib/validation.js";
import { requireUser } from "../../middleware/require-user.js";
import { assertUserCanAccessTrip, getUserProfileByAuthUserId } from "../../lib/data.js";
import { getSupabaseAdminClient, getSupabasePublicClient } from "../../lib/supabase.js";
import { issueStreamToken } from "../../lib/stream-token.js";

export const authRouter: ExpressRouter = Router();

const PARENT_RESET_OTP_EXPIRY_MINUTES = 10;
const PARENT_RESET_RESEND_COOLDOWN_SECONDS = 60;
const PARENT_RESET_MAX_ATTEMPTS = 5;

function isDevelopmentEnv() {
  return (process.env.NODE_ENV ?? "").trim().toLowerCase() === "development";
}

function readOtpHashSecret() {
  const secret = process.env.PARENT_RESET_OTP_SECRET?.trim() || process.env.STREAM_TOKEN_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "test") {
    return "test-parent-reset-otp-secret";
  }

  throw new HttpError(500, "Missing PARENT_RESET_OTP_SECRET or STREAM_TOKEN_SECRET", "missing_otp_secret");
}

function hashOtp(email: string, otp: string) {
  return createHash("sha256")
    .update(`${email.trim().toLowerCase()}|${otp}|${readOtpHashSecret()}`)
    .digest("hex");
}

function generateOtp() {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

authRouter.post("/otp/send", asyncHandler(async (request, response) => {
  const body = otpSendSchema.parse(request.body);
  const { data, error } = await getSupabasePublicClient().auth.signInWithOtp({
    phone: body.phone
  });

  if (error) {
    throw new HttpError(400, error.message, "otp_send_failed");
  }

  response.json({
    success: true,
    phone: body.phone,
    messageId: data.messageId ?? null
  });
}));

authRouter.post("/otp/verify", asyncHandler(async (request, response) => {
  const body = otpVerifySchema.parse(request.body);
  const { data, error } = await getSupabasePublicClient().auth.verifyOtp({
    phone: body.phone,
    token: body.otp,
    type: "sms"
  });

  if (error || !data.session?.access_token || !data.user) {
    throw new HttpError(401, error?.message ?? "OTP verification failed", "otp_verify_failed");
  }

  const user = await getUserProfileByAuthUserId(data.user.id);
  if (!user) {
    throw new HttpError(404, "No SchoolBus user profile found for this Supabase account", "user_profile_not_found");
  }

  const payload: AuthSessionResponse = {
    token: data.session.access_token,
    user
  };

  response.json(payload);
}));

authRouter.post("/forgot-password", asyncHandler(async (request, response) => {
  const body = forgotPasswordSchema.parse(request.body);
  const adminClient = getSupabaseAdminClient();
  const { data: generated, error } = await adminClient.auth.admin.generateLink({
    type: "recovery",
    email: body.email,
    options: body.redirectTo ? { redirectTo: body.redirectTo } : undefined
  });

  if (error || !generated.properties?.action_link) {
    throw new HttpError(400, error?.message ?? "Could not generate recovery link", "recovery_link_failed");
  }

  const user = await getUserProfileByAuthUserId(generated.user.id);
  const fullName = user?.fullName ?? body.email;

  await sendBrevoEmail({
    to: [{ email: body.email, name: fullName }],
    subject: "Reset your SURAKSHA password",
    htmlContent: buildForgotPasswordEmailHtml({
      fullName,
      resetLink: generated.properties.action_link
    })
  });

  response.json({
    success: true,
    email: body.email
  });
}));

authRouter.post("/forgot-password/parent-otp/send", asyncHandler(async (request, response) => {
  const body = parentForgotPasswordOtpSendSchema.parse(request.body ?? {});
  const email = body.email.trim().toLowerCase();
  const adminClient = getSupabaseAdminClient();

  const { data: parentUserRows, error: parentUserError } = await adminClient
    .from("users")
    .select("id, auth_user_id, role, full_name, email")
    .eq("email", email)
    .eq("role", "parent")
    .limit(1);

  if (parentUserError) {
    throw new HttpError(500, parentUserError.message, "parent_lookup_failed");
  }

  const parentUser = parentUserRows?.[0];
  if (!parentUser || typeof parentUser.auth_user_id !== "string" || !parentUser.auth_user_id) {
    response.json({
      success: true,
      email
    });
    return;
  }

  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - PARENT_RESET_RESEND_COOLDOWN_SECONDS * 1000).toISOString();
  const { data: recentOtpRows, error: recentOtpError } = await adminClient
    .from("parent_password_reset_otps")
    .select("id, created_at")
    .eq("email", email)
    .is("consumed_at", null)
    .gte("created_at", cooldownCutoff)
    .order("created_at", { ascending: false })
    .limit(1);

  if (recentOtpError) {
    throw new HttpError(500, recentOtpError.message, "parent_reset_otp_cooldown_check_failed");
  }

  if ((recentOtpRows?.length ?? 0) > 0) {
    throw new HttpError(
      429,
      "Please wait before requesting another OTP",
      "parent_reset_otp_rate_limited"
    );
  }

  const otp = generateOtp();
  const expiresAt = new Date(now.getTime() + PARENT_RESET_OTP_EXPIRY_MINUTES * 60 * 1000);
  const otpHash = hashOtp(email, otp);

  const { error: insertOtpError } = await adminClient.from("parent_password_reset_otps").insert({
    parent_user_id: String(parentUser.id),
    auth_user_id: String(parentUser.auth_user_id),
    email,
    otp_hash: otpHash,
    expires_at: expiresAt.toISOString(),
    attempts: 0,
    consumed_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString()
  });

  if (insertOtpError) {
    throw new HttpError(500, insertOtpError.message, "parent_reset_otp_create_failed");
  }

  const fullName =
    typeof parentUser.full_name === "string" && parentUser.full_name.trim().length > 0
      ? parentUser.full_name.trim()
      : email;

  if (isDevelopmentEnv()) {
    console.info(JSON.stringify({
      scope: "auth",
      event: "parent_reset_otp_issued_dev",
      email,
      otp,
      expiresInMinutes: PARENT_RESET_OTP_EXPIRY_MINUTES
    }));
  } else {
    await sendBrevoEmail({
      to: [{ email, name: fullName }],
      subject: "SURAKSHA password reset OTP",
      htmlContent: buildForgotPasswordOtpEmailHtml({
        fullName,
        otp,
        expiresInMinutes: PARENT_RESET_OTP_EXPIRY_MINUTES
      })
    });
  }

  response.json({
    success: true,
    email,
    ...(isDevelopmentEnv() ? { devOtp: otp } : {})
  });
}));

authRouter.post("/forgot-password/parent-otp/verify", asyncHandler(async (request, response) => {
  const body = parentForgotPasswordOtpVerifySchema.parse(request.body ?? {});
  const email = body.email.trim().toLowerCase();
  const adminClient = getSupabaseAdminClient();

  const { data: otpRows, error: otpLookupError } = await adminClient
    .from("parent_password_reset_otps")
    .select("id, auth_user_id, otp_hash, expires_at, attempts, consumed_at")
    .eq("email", email)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (otpLookupError) {
    throw new HttpError(500, otpLookupError.message, "parent_reset_otp_lookup_failed");
  }

  const otpRow = otpRows?.[0];
  if (!otpRow || typeof otpRow.id !== "string") {
    throw new HttpError(400, "Invalid or expired OTP", "parent_reset_otp_invalid");
  }

  const attempts = typeof otpRow.attempts === "number" ? otpRow.attempts : 0;
  if (attempts >= PARENT_RESET_MAX_ATTEMPTS) {
    throw new HttpError(429, "OTP attempts exceeded", "parent_reset_otp_attempts_exceeded");
  }

  const expiresAt =
    typeof otpRow.expires_at === "string" ? Date.parse(otpRow.expires_at) : Number.NaN;
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    throw new HttpError(400, "OTP has expired", "parent_reset_otp_expired");
  }

  const submittedHash = hashOtp(email, body.otp);
  if (submittedHash !== otpRow.otp_hash) {
    await adminClient
      .from("parent_password_reset_otps")
      .update({
        attempts: attempts + 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", otpRow.id);

    throw new HttpError(400, "Invalid OTP", "parent_reset_otp_invalid");
  }

  if (typeof otpRow.auth_user_id !== "string" || !otpRow.auth_user_id) {
    throw new HttpError(500, "OTP record is missing auth user reference", "parent_reset_otp_invalid_record");
  }

  const { error: updateUserError } = await adminClient.auth.admin.updateUserById(otpRow.auth_user_id, {
    password: body.newPassword
  });

  if (updateUserError) {
    throw new HttpError(500, updateUserError.message, "parent_reset_password_failed");
  }

  const { error: consumeOtpError } = await adminClient
    .from("parent_password_reset_otps")
    .update({
      consumed_at: new Date().toISOString(),
      attempts: attempts + 1,
      updated_at: new Date().toISOString()
    })
    .eq("id", otpRow.id);

  if (consumeOtpError) {
    throw new HttpError(500, consumeOtpError.message, "parent_reset_otp_consume_failed");
  }

  response.json({
    success: true,
    email
  });
}));

authRouter.post("/email/send-verification", asyncHandler(async (request, response) => {
  const body = emailVerificationSchema.parse(request.body);
  const adminClient = getSupabaseAdminClient();
  const normalizedEmail = body.email.trim().toLowerCase();

  const { data: userRows, error: userLookupError } = await adminClient
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .limit(1);

  if (userLookupError) {
    throw new HttpError(500, userLookupError.message, "verification_user_lookup_failed");
  }

  if (!userRows?.length) {
    response.json({
      success: true,
      email: normalizedEmail
    });
    return;
  }

  const { data: generated, error } = await adminClient.auth.admin.generateLink({
    type: "magiclink",
    email: normalizedEmail,
    options: body.redirectTo ? { redirectTo: body.redirectTo } : undefined
  });

  if (error || !generated.properties?.action_link) {
    throw new HttpError(400, error?.message ?? "Could not generate verification link", "verification_link_failed");
  }

  await sendBrevoEmail({
    to: [{ email: normalizedEmail, name: body.fullName }],
    subject: "Verify your SURAKSHA email",
    htmlContent: buildVerificationEmailHtml({
      fullName: body.fullName,
      verificationLink: generated.properties.action_link
    })
  });

  await sendBrevoEmail({
    to: [{ email: normalizedEmail, name: body.fullName }],
    subject: "Welcome to SURAKSHA",
    htmlContent: buildWelcomeEmailHtml({
      fullName: body.fullName
    })
  });

  response.json({
    success: true,
    email: normalizedEmail
  });
}));

authRouter.post("/email-login", asyncHandler(async (request, response) => {
  const body = emailLoginSchema.parse(request.body ?? {});
  const { data, error } = await getSupabasePublicClient().auth.signInWithPassword({
    email: body.email,
    password: body.password
  });

  if (error || !data.session?.access_token || !data.user) {
    throw new HttpError(401, error?.message ?? "Email login failed", "email_login_failed");
  }

  const user = await getUserProfileByAuthUserId(data.user.id);
  if (!user) {
    throw new HttpError(404, "No SchoolBus user profile found for this Supabase account", "user_profile_not_found");
  }

  const payload: AuthSessionResponse = {
    token: data.session.access_token,
    user
  };

  response.json(payload);
}));

authRouter.post("/logout", asyncHandler(async (_request, response) => {
  response.json({ success: true });
}));

authRouter.get("/me", requireUser, asyncHandler(async (request, response) => {
  response.json({
    user: request.currentUser
  });
}));

authRouter.post("/stream-token", requireUser, asyncHandler(async (request, response) => {
  const body = streamTokenRequestSchema.parse(request.body ?? {});
  const actor = request.currentUser!;

  if (actor.role === "admin" && body.schoolId && body.schoolId !== actor.schoolId) {
    throw new HttpError(403, "You cannot request stream token for another school", "stream_scope_forbidden");
  }

  if (actor.role === "parent" && body.schoolId && body.schoolId !== actor.schoolId) {
    throw new HttpError(403, "You cannot request stream token for another school", "stream_scope_forbidden");
  }

  if (actor.role === "driver" && body.schoolId && body.schoolId !== actor.schoolId) {
    throw new HttpError(403, "You cannot request stream token for another school", "stream_scope_forbidden");
  }

  if (body.tripId) {
    await assertUserCanAccessTrip(actor, body.tripId);
  }

  const payload: StreamTokenResponse = issueStreamToken({
    actor,
    schoolId: body.schoolId,
    tripId: body.tripId
  });

  response.json(payload);
}));

