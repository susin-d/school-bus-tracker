import { appendFile } from "node:fs/promises";

import { createClient } from "@supabase/supabase-js";

type AppRole = "parent" | "driver" | "admin" | "super_admin";

type Principal = {
  key: "super_admin" | "admin_a" | "admin_b" | "driver_a" | "driver_b" | "parent_a";
  email: string;
  password: string;
  role: AppRole;
  fullName: string;
  schoolId: string | null;
};

type LooseSupabaseClient = ReturnType<typeof createClient<any>>;

function requireEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

const fixtures = {
  schools: {
    a: { id: "rls-school-1", name: "RLS Alpha School", timezone: "Asia/Kolkata" },
    b: { id: "rls-school-2", name: "RLS Beta School", timezone: "Asia/Kolkata" }
  },
  routes: {
    a: { id: "rls-route-1", schoolId: "rls-school-1", name: "RLS Route Alpha" },
    b: { id: "rls-route-2", schoolId: "rls-school-2", name: "RLS Route Beta" }
  },
  buses: {
    a: { id: "rls-bus-1", schoolId: "rls-school-1", label: "RLS-BUS-1", plate: "KA01RL1001" },
    b: { id: "rls-bus-2", schoolId: "rls-school-2", label: "RLS-BUS-2", plate: "KA01RL2002" }
  },
  trips: {
    a: { id: "rls-trip-1", schoolId: "rls-school-1" },
    b: { id: "rls-trip-2", schoolId: "rls-school-2" }
  },
  students: {
    a: { id: "rls-student-1", schoolId: "rls-school-1", name: "RLS Student One" },
    b: { id: "rls-student-2", schoolId: "rls-school-2", name: "RLS Student Two" }
  }
} as const;

const principals: Principal[] = [
  {
    key: "super_admin",
    email: "rls.super.admin@schoolbus.local",
    password: "RlsSuperAdmin#2026",
    role: "super_admin",
    fullName: "RLS Super Admin",
    schoolId: null
  },
  {
    key: "admin_a",
    email: "rls.admin.alpha@schoolbus.local",
    password: "RlsAdminAlpha#2026",
    role: "admin",
    fullName: "RLS Admin Alpha",
    schoolId: fixtures.schools.a.id
  },
  {
    key: "admin_b",
    email: "rls.admin.beta@schoolbus.local",
    password: "RlsAdminBeta#2026",
    role: "admin",
    fullName: "RLS Admin Beta",
    schoolId: fixtures.schools.b.id
  },
  {
    key: "driver_a",
    email: "rls.driver.alpha@schoolbus.local",
    password: "RlsDriverAlpha#2026",
    role: "driver",
    fullName: "RLS Driver Alpha",
    schoolId: fixtures.schools.a.id
  },
  {
    key: "driver_b",
    email: "rls.driver.beta@schoolbus.local",
    password: "RlsDriverBeta#2026",
    role: "driver",
    fullName: "RLS Driver Beta",
    schoolId: fixtures.schools.b.id
  },
  {
    key: "parent_a",
    email: "rls.parent.alpha@schoolbus.local",
    password: "RlsParentAlpha#2026",
    role: "parent",
    fullName: "RLS Parent Alpha",
    schoolId: fixtures.schools.a.id
  }
];

async function findUserIdByEmail(adminClient: LooseSupabaseClient, email: string) {
  let page = 1;
  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Failed to list auth users for ${email}: ${error.message}`);
    }

    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) {
      return match.id;
    }

    if (data.users.length < 200) {
      break;
    }
    page += 1;
  }

  return null;
}

async function ensureAuthUser(
  adminClient: LooseSupabaseClient,
  principal: Principal
) {
  const existingId = await findUserIdByEmail(adminClient, principal.email);
  if (existingId) {
    const { error } = await adminClient.auth.admin.updateUserById(existingId, {
      password: principal.password,
      email_confirm: true,
      user_metadata: {
        full_name: principal.fullName,
        role: principal.role
      }
    });
    if (error) {
      throw new Error(`Failed to update auth user ${principal.email}: ${error.message}`);
    }
    return existingId;
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email: principal.email,
    password: principal.password,
    email_confirm: true,
    user_metadata: {
      full_name: principal.fullName,
      role: principal.role
    }
  });
  if (error) {
    throw new Error(`Failed to create auth user ${principal.email}: ${error.message}`);
  }
  if (!data.user?.id) {
    throw new Error(`No user id returned for auth user ${principal.email}`);
  }
  return data.user.id;
}

function nowIso() {
  return new Date().toISOString();
}

async function main() {
  const supabaseUrl = requireEnv("SUPABASE_URL");
  const supabaseServiceRole = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabaseAnonKey = requireEnv("SUPABASE_ANON_KEY");

  const adminClient = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const publicClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const authIds = new Map<Principal["key"], string>();
  for (const principal of principals) {
    const id = await ensureAuthUser(adminClient, principal);
    authIds.set(principal.key, id);
  }

  const now = nowIso();

  const { error: schoolError } = await adminClient.from("schools").upsert(
    [
      {
        id: fixtures.schools.a.id,
        name: fixtures.schools.a.name,
        timezone: fixtures.schools.a.timezone,
        created_at: now,
        updated_at: now
      },
      {
        id: fixtures.schools.b.id,
        name: fixtures.schools.b.name,
        timezone: fixtures.schools.b.timezone,
        created_at: now,
        updated_at: now
      }
    ],
    { onConflict: "id" }
  );
  if (schoolError) {
    throw new Error(`Failed to seed schools: ${schoolError.message}`);
  }

  const userRows = principals.map((principal) => {
    const authUserId = authIds.get(principal.key);
    if (!authUserId) {
      throw new Error(`Missing auth id for principal ${principal.email}`);
    }

    return {
      id: authUserId,
      auth_user_id: authUserId,
      school_id: principal.schoolId,
      role: principal.role,
      full_name: principal.fullName,
      phone_e164: "+910000000000",
      email: principal.email,
      status: "active",
      created_at: now,
      updated_at: now
    };
  });

  const { error: usersError } = await adminClient.from("users").upsert(userRows, { onConflict: "id" });
  if (usersError) {
    throw new Error(`Failed to seed users: ${usersError.message}`);
  }

  const { error: routeError } = await adminClient.from("routes").upsert(
    [
      {
        id: fixtures.routes.a.id,
        school_id: fixtures.routes.a.schoolId,
        name: fixtures.routes.a.name,
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        id: fixtures.routes.b.id,
        school_id: fixtures.routes.b.schoolId,
        name: fixtures.routes.b.name,
        status: "active",
        created_at: now,
        updated_at: now
      }
    ],
    { onConflict: "id" }
  );
  if (routeError) {
    throw new Error(`Failed to seed routes: ${routeError.message}`);
  }

  const { error: busError } = await adminClient.from("buses").upsert(
    [
      {
        id: fixtures.buses.a.id,
        school_id: fixtures.buses.a.schoolId,
        label: fixtures.buses.a.label,
        plate_number: fixtures.buses.a.plate,
        capacity: 48,
        status: "active",
        created_at: now,
        updated_at: now
      },
      {
        id: fixtures.buses.b.id,
        school_id: fixtures.buses.b.schoolId,
        label: fixtures.buses.b.label,
        plate_number: fixtures.buses.b.plate,
        capacity: 48,
        status: "active",
        created_at: now,
        updated_at: now
      }
    ],
    { onConflict: "id" }
  );
  if (busError) {
    throw new Error(`Failed to seed buses: ${busError.message}`);
  }

  const driverAId = authIds.get("driver_a");
  const driverBId = authIds.get("driver_b");
  if (!driverAId || !driverBId) {
    throw new Error("Driver fixture ids are missing");
  }

  const { error: tripError } = await adminClient.from("trips").upsert(
    [
      {
        id: fixtures.trips.a.id,
        school_id: fixtures.trips.a.schoolId,
        route_id: fixtures.routes.a.id,
        bus_id: fixtures.buses.a.id,
        driver_id: driverAId,
        route_name: "RLS Pickup Route Alpha",
        bus_label: fixtures.buses.a.label,
        driver_name: "RLS Driver Alpha",
        status: "active",
        trip_kind: "pickup",
        created_at: now,
        updated_at: now
      },
      {
        id: fixtures.trips.b.id,
        school_id: fixtures.trips.b.schoolId,
        route_id: fixtures.routes.b.id,
        bus_id: fixtures.buses.b.id,
        driver_id: driverBId,
        route_name: "RLS Pickup Route Beta",
        bus_label: fixtures.buses.b.label,
        driver_name: "RLS Driver Beta",
        status: "ready",
        trip_kind: "pickup",
        created_at: now,
        updated_at: now
      }
    ],
    { onConflict: "id" }
  );
  if (tripError) {
    throw new Error(`Failed to seed trips: ${tripError.message}`);
  }

  const { error: studentsError } = await adminClient.from("students").upsert(
    [
      {
        id: fixtures.students.a.id,
        school_id: fixtures.students.a.schoolId,
        full_name: fixtures.students.a.name,
        grade: "5",
        address_text: "MG Road, Bengaluru",
        lat: 12.9716,
        lng: 77.5946,
        geocode_status: "resolved",
        created_at: now,
        updated_at: now
      },
      {
        id: fixtures.students.b.id,
        school_id: fixtures.students.b.schoolId,
        full_name: fixtures.students.b.name,
        grade: "6",
        address_text: "Connaught Place, New Delhi",
        lat: 28.6329,
        lng: 77.2195,
        geocode_status: "resolved",
        created_at: now,
        updated_at: now
      }
    ],
    { onConflict: "id" }
  );
  if (studentsError) {
    throw new Error(`Failed to seed students: ${studentsError.message}`);
  }

  const parentAId = authIds.get("parent_a");
  if (!parentAId) {
    throw new Error("Parent fixture id is missing");
  }

  const { error: guardianError } = await adminClient.from("student_guardians").upsert(
    [
      {
        student_id: fixtures.students.a.id,
        parent_id: parentAId,
        relationship: "guardian",
        created_at: now,
        updated_at: now
      }
    ],
    { onConflict: "student_id,parent_id" }
  );
  if (guardianError) {
    throw new Error(`Failed to seed student guardians: ${guardianError.message}`);
  }

  const { error: tripStudentsError } = await adminClient.from("trip_students").upsert(
    [
      {
        trip_id: fixtures.trips.a.id,
        student_id: fixtures.students.a.id,
        full_name: fixtures.students.a.name,
        grade: "5",
        created_at: now,
        updated_at: now
      },
      {
        trip_id: fixtures.trips.b.id,
        student_id: fixtures.students.b.id,
        full_name: fixtures.students.b.name,
        grade: "6",
        created_at: now,
        updated_at: now
      }
    ],
    { onConflict: "trip_id,student_id" }
  );
  if (tripStudentsError) {
    throw new Error(`Failed to seed trip students: ${tripStudentsError.message}`);
  }

  const tokenByKey = new Map<Principal["key"], string>();
  for (const principal of principals) {
    const { data, error } = await publicClient.auth.signInWithPassword({
      email: principal.email,
      password: principal.password
    });
    if (error || !data.session?.access_token) {
      throw new Error(`Failed to sign in ${principal.email}: ${error?.message ?? "No access token"}`);
    }
    tokenByKey.set(principal.key, data.session.access_token);
  }

  const envLines = [
    `RLS_PARENT_TOKEN=${tokenByKey.get("parent_a")}`,
    `RLS_DRIVER_TOKEN=${tokenByKey.get("driver_a")}`,
    `RLS_ADMIN_TOKEN=${tokenByKey.get("admin_a")}`,
    `RLS_SUPER_ADMIN_TOKEN=${tokenByKey.get("super_admin")}`,
    `RLS_PARENT_STUDENT_ID=${fixtures.students.a.id}`,
    `RLS_OTHER_STUDENT_ID=${fixtures.students.b.id}`,
    `RLS_DRIVER_TRIP_ID=${fixtures.trips.a.id}`,
    `RLS_OTHER_TRIP_ID=${fixtures.trips.b.id}`,
    `RLS_ADMIN_SCHOOL_ID=${fixtures.schools.a.id}`,
    `RLS_OTHER_SCHOOL_ID=${fixtures.schools.b.id}`
  ];

  const envOutputPath = process.env.RLS_ENV_OUTPUT_PATH?.trim();
  if (envOutputPath) {
    await appendFile(envOutputPath, `${envLines.join("\n")}\n`, "utf8");
    console.log(`Wrote RLS test env variables to ${envOutputPath}`);
  } else {
    console.log("RLS fixtures seeded.");
    console.log("Set these environment variables before running rls integration tests:");
    console.log(envLines.join("\n"));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
