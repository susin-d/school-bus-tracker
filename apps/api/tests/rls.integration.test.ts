import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

const supabaseUrl = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;

const parentToken = process.env.RLS_PARENT_TOKEN;
const driverToken = process.env.RLS_DRIVER_TOKEN;
const adminToken = process.env.RLS_ADMIN_TOKEN;
const superAdminToken = process.env.RLS_SUPER_ADMIN_TOKEN;

const parentStudentId = process.env.RLS_PARENT_STUDENT_ID;
const otherStudentId = process.env.RLS_OTHER_STUDENT_ID;
const driverTripId = process.env.RLS_DRIVER_TRIP_ID;
const otherTripId = process.env.RLS_OTHER_TRIP_ID;
const adminSchoolId = process.env.RLS_ADMIN_SCHOOL_ID;
const otherSchoolId = process.env.RLS_OTHER_SCHOOL_ID;

const hasRlsEnv = Boolean(
  supabaseUrl &&
  anonKey &&
  parentToken &&
  driverToken &&
  adminToken &&
  superAdminToken &&
  parentStudentId &&
  otherStudentId &&
  driverTripId &&
  otherTripId &&
  adminSchoolId &&
  otherSchoolId
);

if (process.env.CI && !hasRlsEnv) {
  throw new Error(
    "RLS integration env is missing in CI. Run rls fixture bootstrap and export all RLS_* variables."
  );
}

function asClient(token: string): SupabaseClient {
  return createClient(supabaseUrl!, anonKey!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

const describeRls = hasRlsEnv ? describe : describe.skip;

describeRls("supabase rls integration", () => {
  it("parent can only see own linked student", async () => {
    const parent = asClient(parentToken!);
    const ownResult = await parent
      .from("students")
      .select("id")
      .eq("id", parentStudentId!)
      .limit(1);
    expect(ownResult.error).toBeNull();
    expect((ownResult.data ?? []).length).toBe(1);

    const otherResult = await parent
      .from("students")
      .select("id")
      .eq("id", otherStudentId!)
      .limit(1);
    expect(otherResult.error).toBeNull();
    expect((otherResult.data ?? []).length).toBe(0);
  });

  it("driver cannot read non-assigned trip", async () => {
    const driver = asClient(driverToken!);
    const ownTrip = await driver.from("trips").select("id").eq("id", driverTripId!).limit(1);
    expect(ownTrip.error).toBeNull();
    expect((ownTrip.data ?? []).length).toBe(1);

    const otherTrip = await driver.from("trips").select("id").eq("id", otherTripId!).limit(1);
    expect(otherTrip.error).toBeNull();
    expect((otherTrip.data ?? []).length).toBe(0);
  });

  it("school admin cannot read another school's trips", async () => {
    const admin = asClient(adminToken!);

    const ownSchoolTrips = await admin
      .from("trips")
      .select("id")
      .eq("school_id", adminSchoolId!)
      .limit(5);
    expect(ownSchoolTrips.error).toBeNull();
    expect((ownSchoolTrips.data ?? []).length).toBeGreaterThan(0);

    const otherSchoolTrips = await admin
      .from("trips")
      .select("id")
      .eq("school_id", otherSchoolId!)
      .limit(5);
    expect(otherSchoolTrips.error).toBeNull();
    expect((otherSchoolTrips.data ?? []).length).toBe(0);
  });

  it("super admin can read cross-school trips", async () => {
    const superAdmin = asClient(superAdminToken!);
    const result = await superAdmin
      .from("trips")
      .select("id, school_id")
      .in("school_id", [adminSchoolId!, otherSchoolId!])
      .limit(10);
    expect(result.error).toBeNull();
    const schools = new Set((result.data ?? []).map((row) => row.school_id));
    expect(schools.has(adminSchoolId!)).toBe(true);
    expect(schools.has(otherSchoolId!)).toBe(true);
  });

  it("driver cannot insert location for unassigned trip", async () => {
    const driver = asClient(driverToken!);
    const insert = await driver.from("trip_locations").insert({
      trip_id: otherTripId!,
      latitude: 12.9,
      longitude: 77.6,
      recorded_at: new Date().toISOString()
    });

    expect(insert.error).not.toBeNull();
  });
});
