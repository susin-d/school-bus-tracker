import { getSupabaseAdminClient } from "../lib/supabase.js";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

async function main() {
  const email = requireEnv("SYSTEM_ADMIN_EMAIL");
  const password = requireEnv("SYSTEM_ADMIN_PASSWORD");
  const fullName = process.env.SYSTEM_ADMIN_FULL_NAME ?? "System Admin";
  const phone = process.env.SYSTEM_ADMIN_PHONE ?? "";

  const supabase = getSupabaseAdminClient();

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "super_admin"
    }
  });

  let authUserId = created.user?.id;
  if (authError) {
    // If the account already exists, repair it by resetting password + metadata.
    if ((authError as { code?: string }).code !== "email_exists") {
      throw authError;
    }

    const { data: usersResponse, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) {
      throw usersError;
    }

    const existingUser = usersResponse.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase()
    );
    if (!existingUser?.id) {
      throw new Error(`System admin exists for ${email} but could not be resolved`);
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        full_name: fullName,
        role: "super_admin"
      }
    });

    if (updateError) {
      throw updateError;
    }

    authUserId = existingUser.id;
  }

  if (!authUserId) {
    throw new Error("Supabase did not return a user id for the system admin");
  }

  const nowIso = new Date().toISOString();
  const profilePayload: Record<string, unknown> = {
    id: authUserId,
    auth_user_id: authUserId,
    school_id: null,
    role: "super_admin",
    full_name: fullName,
    phone_e164: phone,
    email,
    status: "active",
    created_at: nowIso,
    updated_at: nowIso
  };

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

  console.log(`System admin ready: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
