import { getSupabaseAdminClient } from "../lib/supabase.js";

type AdminRole = "super_admin" | "admin";

interface AccountSeed {
  email: string;
  password: string;
  role: AdminRole;
  fullName: string;
  fallbackSchoolIdEnv?: string;
}

const ACCOUNT_SEEDS: readonly AccountSeed[] = [
  {
    email: "rls.super.admin@schoolbus.local",
    password: "RlsSuperAdmin#2026",
    role: "super_admin",
    fullName: "RLS Super Admin"
  },
  {
    email: "admin.school@susindran.in",
    password: "admin@school",
    role: "admin",
    fullName: "School Admin",
    fallbackSchoolIdEnv: "DEMO_ADMIN_SCHOOL_ID"
  }
] as const;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

async function findAuthUserIdByEmail(email: string) {
  const supabase = getSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(email);

  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    throw error;
  }

  const user = data.users.find((item) => normalizeEmail(item.email ?? "") === normalizedEmail);
  return user?.id;
}

async function ensureAuthUser(account: AccountSeed) {
  const supabase = getSupabaseAdminClient();

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
    user_metadata: {
      full_name: account.fullName,
      role: account.role
    }
  });

  if (!createError && created.user?.id) {
    return created.user.id;
  }

  if ((createError as { code?: string }).code !== "email_exists") {
    throw createError;
  }

  const existingUserId = await findAuthUserIdByEmail(account.email);
  if (!existingUserId) {
    throw new Error(`Auth user exists for ${account.email} but could not be resolved`);
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(existingUserId, {
    password: account.password,
    email_confirm: true,
    user_metadata: {
      full_name: account.fullName,
      role: account.role
    }
  });

  if (updateError) {
    throw updateError;
  }

  return existingUserId;
}

async function resolveSchoolIdForAccount(account: AccountSeed, authUserId: string) {
  if (account.role === "super_admin") {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const normalizedEmail = normalizeEmail(account.email);

  const { data: byIdRow, error: byIdError } = await supabase
    .from("users")
    .select("school_id")
    .eq("id", authUserId)
    .maybeSingle();

  if (byIdError) {
    throw byIdError;
  }

  const fromId = typeof byIdRow?.school_id === "string" ? byIdRow.school_id : null;
  if (fromId) {
    return fromId;
  }

  const { data: byEmailRows, error: byEmailError } = await supabase
    .from("users")
    .select("school_id, email")
    .eq("email", normalizedEmail)
    .limit(1);

  if (byEmailError) {
    throw byEmailError;
  }

  const fromEmail =
    typeof byEmailRows?.[0]?.school_id === "string" ? String(byEmailRows[0].school_id) : null;
  if (fromEmail) {
    return fromEmail;
  }

  const fallback = account.fallbackSchoolIdEnv ? process.env[account.fallbackSchoolIdEnv] : undefined;
  if (fallback && fallback.trim().length > 0) {
    return fallback.trim();
  }

  throw new Error(
    `Could not resolve school_id for admin account ${account.email}. ` +
      `Set ${account.fallbackSchoolIdEnv ?? "DEMO_ADMIN_SCHOOL_ID"} in env or create a users row first.`
  );
}

async function upsertUserProfile(account: AccountSeed, authUserId: string) {
  const supabase = getSupabaseAdminClient();
  const nowIso = new Date().toISOString();
  const schoolId = await resolveSchoolIdForAccount(account, authUserId);

  const profilePayload: Record<string, unknown> = {
    id: authUserId,
    auth_user_id: authUserId,
    school_id: schoolId,
    role: account.role,
    full_name: account.fullName,
    email: normalizeEmail(account.email),
    status: "active",
    updated_at: nowIso
  };

  const { data: existingRow, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("id", authUserId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existingRow) {
    profilePayload.created_at = nowIso;
  }

  let profileError: { message?: string } | null = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await supabase.from("users").upsert(profilePayload, {
      onConflict: "id"
    });
    profileError = (result.error as { message?: string } | null) ?? null;
    if (!profileError) {
      break;
    }

    const missingColumnMatch = /Could not find the '([^']+)' column/i.exec(profileError.message ?? "");
    const missingColumn = missingColumnMatch?.[1];
    if (!missingColumn || !(missingColumn in profilePayload)) {
      break;
    }

    delete profilePayload[missingColumn];
  }

  if (profileError) {
    throw profileError;
  }
}

async function main() {
  for (const account of ACCOUNT_SEEDS) {
    const authUserId = await ensureAuthUser(account);
    await upsertUserProfile(account, authUserId);
    console.log(`Updated ${account.role} account: ${account.email}`);
  }

  console.log("Demo admin credentials updated successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
