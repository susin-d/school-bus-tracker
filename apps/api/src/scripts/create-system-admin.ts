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

  if (authError) {
    throw authError;
  }

  const authUserId = created.user?.id;
  if (!authUserId) {
    throw new Error("Supabase did not return a user id for the system admin");
  }

  const { error: profileError } = await supabase.from("users").upsert(
    {
      id: authUserId,
      auth_user_id: authUserId,
      school_id: null,
      role: "super_admin",
      full_name: fullName,
      phone_e164: phone,
      email,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw profileError;
  }

  console.log(`System admin ready: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
