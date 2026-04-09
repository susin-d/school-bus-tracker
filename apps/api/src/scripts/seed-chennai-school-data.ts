import { getSupabaseAdminClient } from "../lib/supabase.js";

type AppRole = "parent" | "driver" | "admin" | "super_admin";

type DriverSeed = {
  key: "d1" | "d2" | "d3";
  email: string;
  password: string;
  fullName: string;
  phone: string;
  licenseNo: string;
};

type StudentSeed = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  grade: string;
  section: string;
  addressText: string;
  lat: number;
  lng: number;
  schoolId: string;
};

const SCHOOL = {
  id: "chn-school-ops-01",
  name: "SchoolBus Chennai Operations School",
  slug: "schoolbus-chennai-ops",
  address: "Kendriya Vidyalaya IIT Chennai, IIT Campus, Chennai, Tamil Nadu 600036",
  lat: 12.9916,
  lng: 80.2337
} as const;

const DRIVERS: DriverSeed[] = [
  {
    key: "d1",
    email: "driver.adyar.01@schoolbus.local",
    password: "DriverAdyar#2026",
    fullName: "Arun Prakash",
    phone: "+919840000101",
    licenseNo: "TN-ADY-LIC-0101"
  },
  {
    key: "d2",
    email: "driver.velachery.02@schoolbus.local",
    password: "DriverVelachery#2026",
    fullName: "Bala Subramanian",
    phone: "+919840000102",
    licenseNo: "TN-VEL-LIC-0102"
  },
  {
    key: "d3",
    email: "driver.thiruvanmiyur.03@schoolbus.local",
    password: "DriverThiruvanmiyur#2026",
    fullName: "Charan Kumar",
    phone: "+919840000103",
    licenseNo: "TN-THI-LIC-0103"
  }
];

const LOCALITIES = [
  "Adyar, Chennai 600020",
  "Thiruvanmiyur, Chennai 600041",
  "Velachery, Chennai 600042",
  "Taramani, Chennai 600113",
  "Guindy, Chennai 600032",
  "Kotturpuram, Chennai 600085",
  "Saidapet, Chennai 600015",
  "Besant Nagar, Chennai 600090",
  "Indira Nagar, Chennai 600020",
  "Raja Annamalai Puram, Chennai 600028",
  "Mandaveli, Chennai 600028",
  "Mylapore, Chennai 600004",
  "Nandanam, Chennai 600035"
] as const;

const FIRST_NAMES = [
  "Aarav", "Aadhya", "Advik", "Akshara", "Arjun", "Anika", "Bhavin", "Charvi", "Dev", "Diya",
  "Eshan", "Fatima", "Gokul", "Harini", "Ishaan", "Janani", "Karthik", "Lavanya", "Manav", "Nithya",
  "Omkar", "Pavithra", "Raghav", "Sahana", "Tejas", "Uma", "Varun", "Yamini", "Zayan", "Meera",
  "Naveen", "Pranav", "Ritika", "Sanjay", "Trisha", "Uday", "Vikram", "Yashika", "Zara"
] as const;

const LAST_NAMES = [
  "Iyer", "Krishnan", "Subramanian", "Narayanan", "Kumar", "Raman", "Srinivasan",
  "Menon", "Rajan", "Venkatesh", "Anand", "Balan", "Mohan"
] as const;

function nowIso() {
  return new Date().toISOString();
}

function asRadians(value: number) {
  return (value * Math.PI) / 180;
}

function asDegrees(value: number) {
  return (value * 180) / Math.PI;
}

function offsetWithinRadiusKm(originLat: number, originLng: number, distanceKm: number, bearingDeg: number) {
  const earthRadiusKm = 6371;
  const angularDistance = distanceKm / earthRadiusKm;
  const bearing = asRadians(bearingDeg);
  const lat1 = asRadians(originLat);
  const lng1 = asRadians(originLng);

  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinAd = Math.sin(angularDistance);
  const cosAd = Math.cos(angularDistance);

  const lat2 = Math.asin(sinLat1 * cosAd + cosLat1 * sinAd * Math.cos(bearing));
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * sinAd * cosLat1,
    cosAd - sinLat1 * Math.sin(lat2)
  );

  return {
    lat: Number(asDegrees(lat2).toFixed(6)),
    lng: Number(asDegrees(lng2).toFixed(6))
  };
}

async function findUserIdByEmail(email: string) {
  const client = getSupabaseAdminClient();
  let page = 1;
  while (page <= 10) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 });
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

async function ensureAuthUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: AppRole;
}) {
  const client = getSupabaseAdminClient();
  const existingId = await findUserIdByEmail(input.email);
  if (existingId) {
    const { error } = await client.auth.admin.updateUserById(existingId, {
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        role: input.role
      }
    });
    if (error) {
      throw new Error(`Failed to update auth user ${input.email}: ${error.message}`);
    }
    return existingId;
  }

  const { data, error } = await client.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      full_name: input.fullName,
      role: input.role
    }
  });
  if (error) {
    throw new Error(`Failed to create auth user ${input.email}: ${error.message}`);
  }
  if (!data.user?.id) {
    throw new Error(`No auth user id returned for ${input.email}`);
  }
  return data.user.id;
}

function buildStudents(total: number): StudentSeed[] {
  const students: StudentSeed[] = [];
  const sections = ["A", "B", "C"] as const;
  for (let index = 0; index < total; index += 1) {
    const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
    const lastName = LAST_NAMES[index % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const grade = String((index % 8) + 1);
    const section = sections[index % sections.length];
    const locality = LOCALITIES[index % LOCALITIES.length];
    const distanceKm = 0.8 + ((index * 23) % 88) / 10;
    const bearing = (index * 37) % 360;
    const coords = offsetWithinRadiusKm(SCHOOL.lat, SCHOOL.lng, distanceKm, bearing);
    const addressText = `${12 + (index % 90)}, ${locality}`;

    students.push({
      id: `chn-student-${String(index + 1).padStart(2, "0")}`,
      firstName,
      lastName,
      fullName,
      grade,
      section,
      addressText,
      lat: coords.lat,
      lng: coords.lng,
      schoolId: SCHOOL.id
    });
  }
  return students;
}

async function main() {
  const client = getSupabaseAdminClient();
  const now = nowIso();

  const { error: schoolError } = await client.from("schools").upsert(
    {
      id: SCHOOL.id,
      name: SCHOOL.name,
      slug: SCHOOL.slug,
      address: SCHOOL.address,
      latitude: SCHOOL.lat,
      longitude: SCHOOL.lng,
      is_active: true,
      created_at: now,
      updated_at: now
    },
    { onConflict: "id" }
  );
  if (schoolError) {
    throw new Error(`Failed to upsert school: ${schoolError.message}`);
  }

  const driverAuthIds = new Map<DriverSeed["key"], string>();
  for (const driver of DRIVERS) {
    const authUserId = await ensureAuthUser({
      email: driver.email,
      password: driver.password,
      fullName: driver.fullName,
      role: "driver"
    });
    driverAuthIds.set(driver.key, authUserId);
  }

  const userRows = DRIVERS.map((driver) => {
    const authUserId = driverAuthIds.get(driver.key);
    if (!authUserId) {
      throw new Error(`Missing auth id for ${driver.email}`);
    }

    return {
      id: authUserId,
      auth_user_id: authUserId,
      email: driver.email,
      full_name: driver.fullName,
      phone: driver.phone,
      role: "driver",
      school_id: SCHOOL.id,
      is_active: true,
      created_at: now,
      updated_at: now
    };
  });

  const { error: usersError } = await client.from("users").upsert(userRows, { onConflict: "id" });
  if (usersError) {
    throw new Error(`Failed to upsert driver users: ${usersError.message}`);
  }

  const driverRows = DRIVERS.map((driver, index) => {
    const authUserId = driverAuthIds.get(driver.key);
    if (!authUserId) {
      throw new Error(`Missing auth id for ${driver.email}`);
    }
    const [firstName, ...rest] = driver.fullName.split(" ");
    const lastName = rest.join(" ") || "Driver";

    return {
      id: `chn-driver-${String(index + 1).padStart(2, "0")}`,
      school_id: SCHOOL.id,
      user_id: authUserId,
      first_name: firstName,
      last_name: lastName,
      phone: driver.phone,
      license_no: driver.licenseNo,
      is_active: true,
      created_at: now,
      updated_at: now
    };
  });

  const { error: driversError } = await client.from("drivers").upsert(driverRows, { onConflict: "id" });
  if (driversError) {
    throw new Error(`Failed to upsert drivers: ${driversError.message}`);
  }

  const routeRows = DRIVERS.map((driver, index) => ({
    id: `chn-route-${String(index + 1).padStart(2, "0")}`,
    school_id: SCHOOL.id,
    name: `Chennai Route ${index + 1} - ${driver.fullName.split(" ")[0]}`,
    description: `Morning pickup route ${index + 1} within 10km radius of IIT Chennai`,
    direction: "pickup",
    is_active: true,
    created_at: now,
    updated_at: now
  }));

  const { error: routesError } = await client.from("routes").upsert(routeRows, { onConflict: "id" });
  if (routesError) {
    throw new Error(`Failed to upsert routes: ${routesError.message}`);
  }

  const busRows = DRIVERS.map((_, index) => ({
    id: `chn-bus-${String(index + 1).padStart(2, "0")}`,
    school_id: SCHOOL.id,
    number: `CHN-${index + 1}`,
    capacity: 48,
    is_active: true,
    created_at: now,
    updated_at: now
  }));

  const { error: busesError } = await client.from("buses").upsert(busRows, { onConflict: "id" });
  if (busesError) {
    throw new Error(`Failed to upsert buses: ${busesError.message}`);
  }

  const tripRows = DRIVERS.map((driver, index) => {
    return {
      id: `chn-trip-${String(index + 1).padStart(2, "0")}`,
      school_id: SCHOOL.id,
      route_id: routeRows[index]!.id,
      bus_id: busRows[index]!.id,
      driver_id: driverRows[index]!.id,
      status: "planned",
      created_at: now,
      updated_at: now
    };
  });

  const { error: tripsError } = await client.from("trips").upsert(tripRows, { onConflict: "id" });
  if (tripsError) {
    throw new Error(`Failed to upsert trips: ${tripsError.message}`);
  }

  const students = buildStudents(39);
  const studentRows = students.map((student) => ({
    id: student.id,
    school_id: student.schoolId,
    first_name: student.firstName,
    last_name: student.lastName,
    grade: student.grade,
    section: student.section,
    address_text: student.addressText,
    lat: student.lat,
    lng: student.lng,
    geocode_status: "resolved",
    is_active: true,
    created_at: now,
    updated_at: now
  }));

  const { error: studentsError } = await client.from("students").upsert(studentRows, { onConflict: "id" });
  if (studentsError) {
    throw new Error(`Failed to upsert students: ${studentsError.message}`);
  }

  const tripStudentsRows = students.map((student, index) => {
    const tripIndex = Math.floor(index / 13);
    const trip = tripRows[tripIndex]!;
    return {
      id: `chn-trip-student-${String(index + 1).padStart(2, "0")}`,
      trip_id: trip.id,
      student_id: student.id,
      created_at: now,
      updated_at: now
    };
  });

  const { error: tripStudentsError } = await client.from("trip_students").upsert(tripStudentsRows, {
    onConflict: "id"
  });
  if (tripStudentsError) {
    throw new Error(`Failed to upsert trip_students: ${tripStudentsError.message}`);
  }

  const assignmentRows = students.map((student, index) => {
    const tripIndex = Math.floor(index / 13);
    const routeId = routeRows[tripIndex]!.id;
    return {
      id: `chn-assignment-${String(index + 1).padStart(2, "0")}`,
      school_id: SCHOOL.id,
      student_id: student.id,
      route_id: routeId,
      stop_id: null,
      is_active: true,
      created_at: now,
      updated_at: now
    };
  });

  const { error: assignmentsError } = await client.from("student_transport_assignments").upsert(
    assignmentRows,
    { onConflict: "id" }
  );
  if (assignmentsError) {
    throw new Error(`Failed to upsert student_transport_assignments: ${assignmentsError.message}`);
  }

  console.log("Seed complete:");
  console.log(`School: ${SCHOOL.name} (${SCHOOL.id})`);
  console.log(`School address: ${SCHOOL.address}`);
  console.log("Drivers (13 students each):");
  DRIVERS.forEach((driver, index) => {
    const start = index * 13;
    const end = start + 13;
    console.log(`- ${driver.fullName} (${driver.email}): ${students.slice(start, end).length} students`);
  });
  console.log(`Total students seeded: ${students.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
