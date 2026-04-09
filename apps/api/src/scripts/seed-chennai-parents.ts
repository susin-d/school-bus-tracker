import { getSupabaseAdminClient } from "../lib/supabase.js";

type AppRole = "parent" | "driver" | "admin" | "super_admin";

type StudentRow = {
  id: string;
  first_name: string;
  last_name: string;
};

const SCHOOL_ID = "chn-school-ops-01";

function nowIso() {
  return new Date().toISOString();
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

async function main() {
  const client = getSupabaseAdminClient();
  const now = nowIso();

  const { data: students, error: studentsError } = await client
    .from("students")
    .select("id, first_name, last_name")
    .eq("school_id", SCHOOL_ID)
    .order("created_at", { ascending: true });

  if (studentsError) {
    throw new Error(`Failed to fetch students: ${studentsError.message}`);
  }

  const studentRows = (students ?? []) as StudentRow[];
  if (studentRows.length === 0) {
    throw new Error("No students found for Chennai seed school. Run seed-chennai-school-data first.");
  }

  const parentAuthIds = new Map<string, string>();

  for (let index = 0; index < studentRows.length; index += 1) {
    const student = studentRows[index]!;
    const sequence = String(index + 1).padStart(2, "0");
    const parentEmail = `parent.chn.${sequence}@schoolbus.local`;
    const parentName = `${student.first_name} ${student.last_name} Parent`;
    const parentPassword = `ParentChn${sequence}#2026`;

    const authUserId = await ensureAuthUser({
      email: parentEmail,
      password: parentPassword,
      fullName: parentName,
      role: "parent"
    });

    parentAuthIds.set(student.id, authUserId);
  }

  const parentUsers = studentRows.map((student, index) => {
    const sequence = String(index + 1).padStart(2, "0");
    const authUserId = parentAuthIds.get(student.id);
    if (!authUserId) {
      throw new Error(`Missing parent auth user id for student ${student.id}`);
    }

    return {
      id: authUserId,
      auth_user_id: authUserId,
      email: `parent.chn.${sequence}@schoolbus.local`,
      full_name: `${student.first_name} ${student.last_name} Parent`,
      phone: `+9198500${String(1000 + index).slice(-4)}`,
      role: "parent",
      school_id: SCHOOL_ID,
      is_active: true,
      created_at: now,
      updated_at: now
    };
  });

  const { error: usersError } = await client.from("users").upsert(parentUsers, { onConflict: "id" });
  if (usersError) {
    throw new Error(`Failed to upsert parent users: ${usersError.message}`);
  }

  const guardianRows = studentRows.map((student) => {
    const parentId = parentAuthIds.get(student.id);
    if (!parentId) {
      throw new Error(`Missing parent id for student ${student.id}`);
    }

    return {
      student_id: student.id,
      parent_id: parentId,
      created_at: now
    };
  });

  const { error: guardianError } = await client
    .from("student_guardians")
    .upsert(guardianRows, { onConflict: "student_id,parent_id" });

  if (guardianError) {
    throw new Error(`Failed to upsert student_guardians: ${guardianError.message}`);
  }

  console.log(`Parent seeding complete for school ${SCHOOL_ID}`);
  console.log(`Parents created/updated: ${parentUsers.length}`);
  console.log(`Student-guardian links created/updated: ${guardianRows.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
