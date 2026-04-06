import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;
let publicClient: SupabaseClient | null = null;

function readEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export function getSupabaseAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  adminClient = createClient(
    readEnv("SUPABASE_URL"),
    readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return adminClient;
}

export function getSupabasePublicClient() {
  if (publicClient) {
    return publicClient;
  }

  publicClient = createClient(
    readEnv("SUPABASE_URL"),
    readEnv("SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  return publicClient;
}

export async function getSupabaseUser(accessToken: string): Promise<User> {
  const client = getSupabaseAdminClient();
  const { data, error } = await client.auth.getUser(accessToken);

  if (error || !data.user) {
    throw new Error(error?.message ?? "Invalid Supabase access token");
  }

  return data.user;
}
