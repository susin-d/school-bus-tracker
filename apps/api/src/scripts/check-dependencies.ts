import { getSupabaseAdminClient } from "../lib/supabase.js";

type CheckResult = {
  name: string;
  ok: boolean;
  details: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

async function checkSupabase(): Promise<CheckResult> {
  const client = getSupabaseAdminClient();
  const { data, error } = await client.from("schools").select("id").limit(1);

  if (error) {
    return {
      name: "Supabase",
      ok: false,
      details: error.message
    };
  }

  return {
    name: "Supabase",
    ok: true,
    details: `connected; sample rows=${Array.isArray(data) ? data.length : 0}`
  };
}

async function checkBrevo(): Promise<CheckResult> {
  const apiKey = requireEnv("BREVO_API_KEY");

  const response = await fetch("https://api.brevo.com/v3/account", {
    headers: {
      accept: "application/json",
      "api-key": apiKey
    }
  });

  if (!response.ok) {
    return {
      name: "Brevo",
      ok: false,
      details: `HTTP ${response.status}: ${await response.text()}`
    };
  }

  const payload = (await response.json()) as { email?: string; companyName?: string };
  return {
    name: "Brevo",
    ok: true,
    details: `connected; account=${payload.companyName ?? payload.email ?? "unknown"}`
  };
}

async function checkGoogleMaps(): Promise<CheckResult> {
  const apiKey = requireEnv("GOOGLE_MAPS_API_KEY");
  const endpoint = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  endpoint.searchParams.set("address", "1600 Amphitheatre Parkway, Mountain View, CA");
  endpoint.searchParams.set("key", apiKey);

  const response = await fetch(endpoint);
  if (!response.ok) {
    return {
      name: "Google Maps",
      ok: false,
      details: `HTTP ${response.status}`
    };
  }

  const payload = (await response.json()) as {
    status?: string;
    error_message?: string;
    results?: unknown[];
  };

  if (payload.status !== "OK") {
    return {
      name: "Google Maps",
      ok: false,
      details: payload.error_message || payload.status || "unknown error"
    };
  }

  return {
    name: "Google Maps",
    ok: true,
    details: `connected; results=${payload.results?.length ?? 0}`
  };
}

async function main() {
  const checks = await Promise.allSettled([
    checkSupabase(),
    checkBrevo(),
    checkGoogleMaps()
  ]);

  let exitCode = 0;
  for (const result of checks) {
    if (result.status === "fulfilled") {
      const prefix = result.value.ok ? "OK" : "FAIL";
      console.log(`[${prefix}] ${result.value.name}: ${result.value.details}`);
      if (!result.value.ok) {
        exitCode = 1;
      }
      continue;
    }

    exitCode = 1;
    console.log(`[FAIL] unknown: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
  }

  process.exitCode = exitCode;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});