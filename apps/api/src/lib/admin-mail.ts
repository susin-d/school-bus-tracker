import type { UserProfile } from "@school-bus/shared";

import { sendBrevoEmail } from "./email/brevo.js";
import { buildAdminBroadcastEmailHtml } from "./email/templates.js";
import { HttpError } from "./http.js";
import { getSupabaseAdminClient } from "./supabase.js";

type SendAdminBroadcastInput = {
  actor: UserProfile;
  mode: "all_students" | "selected_students" | "emails" | "users";
  subject: string;
  message: string;
  schoolId?: string;
  studentIds?: string[];
  emails?: string[];
  userIds?: string[];
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function assertSuperAdmin(actor: UserProfile) {
  if (actor.role !== "super_admin") {
    throw new HttpError(403, "Only super admin can use this target mode", "mail_target_forbidden");
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatMessageHtml(message: string) {
  return escapeHtml(message).replaceAll("\n", "<br/>");
}

async function resolveRecipientEmailsByStudents(input: {
  actor: UserProfile;
  schoolId?: string;
  selectedStudentIds?: string[];
}) {
  const adminClient = getSupabaseAdminClient();
  const isSuperAdmin = input.actor.role === "super_admin";
  const scopeSchoolId = isSuperAdmin ? input.schoolId : input.actor.schoolId;

  let studentQuery = adminClient
    .from("students")
    .select("id, school_id");

  if (scopeSchoolId) {
    studentQuery = studentQuery.eq("school_id", scopeSchoolId);
  }

  if (input.selectedStudentIds && input.selectedStudentIds.length > 0) {
    studentQuery = studentQuery.in("id", input.selectedStudentIds);
  }

  const { data: studentRows, error: studentError } = await studentQuery;
  if (studentError) {
    throw new HttpError(500, studentError.message, "mail_students_lookup_failed");
  }

  const students = studentRows ?? [];
  if (input.selectedStudentIds && input.selectedStudentIds.length > 0) {
    const foundIds = new Set(
      students.map((row) => asString((row as Record<string, unknown>).id)).filter(Boolean)
    );
    const missingRequested = input.selectedStudentIds.some((studentId) => !foundIds.has(studentId));
    if (missingRequested) {
      throw new HttpError(403, "One or more selected students are outside your scope", "mail_scope_forbidden");
    }
  }

  if (!isSuperAdmin && students.some((row) => asString((row as Record<string, unknown>).school_id) !== input.actor.schoolId)) {
    throw new HttpError(403, "You can only email students in your school", "mail_scope_forbidden");
  }

  const studentIds = students
    .map((row) => asString((row as Record<string, unknown>).id))
    .filter(Boolean);

  if (studentIds.length === 0) {
    return [];
  }

  const { data: guardianRows, error: guardianError } = await adminClient
    .from("student_guardians")
    .select("parent_id")
    .in("student_id", studentIds);

  if (guardianError) {
    throw new HttpError(500, guardianError.message, "mail_guardians_lookup_failed");
  }

  const parentIds = unique(
    (guardianRows ?? [])
      .map((row) => asString((row as Record<string, unknown>).parent_id))
      .filter(Boolean)
  );
  if (parentIds.length === 0) {
    return [];
  }

  const { data: userRows, error: userError } = await adminClient
    .from("users")
    .select("id, school_id, email")
    .in("id", parentIds);

  if (userError) {
    throw new HttpError(500, userError.message, "mail_parent_users_lookup_failed");
  }

  const emails = (userRows ?? [])
    .filter((row) => {
      const schoolId = asString((row as Record<string, unknown>).school_id);
      return isSuperAdmin || schoolId === input.actor.schoolId;
    })
    .map((row) => normalizeEmail(asString((row as Record<string, unknown>).email)))
    .filter(Boolean);

  return unique(emails);
}

async function resolveRecipientEmailsByUsers(input: {
  actor: UserProfile;
  userIds: string[];
}) {
  assertSuperAdmin(input.actor);
  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("users")
    .select("id, email")
    .in("id", input.userIds);

  if (error) {
    throw new HttpError(500, error.message, "mail_users_lookup_failed");
  }

  return unique(
    (data ?? [])
      .map((row) => normalizeEmail(asString((row as Record<string, unknown>).email)))
      .filter(Boolean)
  );
}

function splitIntoChunks<T>(list: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < list.length; index += size) {
    chunks.push(list.slice(index, index + size));
  }
  return chunks;
}

export async function sendAdminBroadcastEmail(input: SendAdminBroadcastInput) {
  const actor = input.actor;
  if (actor.role !== "admin" && actor.role !== "super_admin") {
    throw new HttpError(403, "Only admins can send broadcast emails", "mail_send_forbidden");
  }
  if (actor.role === "admin" && input.schoolId && input.schoolId !== actor.schoolId) {
    throw new HttpError(403, "You can only send mail within your school", "mail_scope_forbidden");
  }

  let recipientEmails: string[] = [];
  switch (input.mode) {
    case "all_students":
      recipientEmails = await resolveRecipientEmailsByStudents({
        actor,
        schoolId: input.schoolId
      });
      break;
    case "selected_students":
      recipientEmails = await resolveRecipientEmailsByStudents({
        actor,
        schoolId: input.schoolId,
        selectedStudentIds: input.studentIds ?? []
      });
      break;
    case "emails":
      assertSuperAdmin(actor);
      recipientEmails = unique((input.emails ?? []).map(normalizeEmail).filter(Boolean));
      break;
    case "users":
      recipientEmails = await resolveRecipientEmailsByUsers({
        actor,
        userIds: input.userIds ?? []
      });
      break;
    default:
      throw new HttpError(400, "Unsupported mail target mode", "mail_target_invalid");
  }

  if (recipientEmails.length === 0) {
    throw new HttpError(400, "No recipients resolved for this request", "mail_no_recipients");
  }

  const htmlContent = buildAdminBroadcastEmailHtml({
    heading: input.subject.trim(),
    messageHtml: formatMessageHtml(input.message.trim())
  });

  const chunks = splitIntoChunks(recipientEmails, 80);
  for (const chunk of chunks) {
    await sendBrevoEmail({
      to: chunk.map((email) => ({ email })),
      subject: input.subject.trim(),
      htmlContent
    });
  }

  return {
    ok: true,
    mode: input.mode,
    recipientCount: recipientEmails.length
  };
}
