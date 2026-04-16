import { getSupabaseAdminClient } from "../lib/supabase.js";

const SCHOOL = {
  id: "chn-school-ops-01",
  name: "SchoolBus Chennai Operations School",
  slug: "schoolbus-chennai-ops",
  address: "Kendriya Vidyalaya IIT Chennai, IIT Campus, Chennai, Tamil Nadu 600036",
  latitude: 12.9916,
  longitude: 80.2337,
} as const;

async function main() {
  const client = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { error: schoolError } = await client.from("schools").upsert(
    {
      id: SCHOOL.id,
      name: SCHOOL.name,
      slug: SCHOOL.slug,
      address: SCHOOL.address,
      latitude: SCHOOL.latitude,
      longitude: SCHOOL.longitude,
      is_active: true,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "id" }
  );

  if (schoolError) {
    throw new Error(`Failed to upsert school: ${schoolError.message}`);
  }

  const { error: mapSettingsError } = await client.from("school_map_settings").upsert(
    {
      school_id: SCHOOL.id,
      dispatch_latitude: SCHOOL.latitude,
      dispatch_longitude: SCHOOL.longitude,
      no_show_wait_seconds: 120,
      max_detour_minutes: 15,
      created_at: now,
      updated_at: now,
    },
    { onConflict: "school_id" }
  );

  if (mapSettingsError) {
    throw new Error(`Failed to upsert school_map_settings: ${mapSettingsError.message}`);
  }

  console.log("Upserted school and dispatch location:");
  console.log(`School: ${SCHOOL.name}`);
  console.log(`Address: ${SCHOOL.address}`);
  console.log(`Coordinates: ${SCHOOL.latitude}, ${SCHOOL.longitude}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
