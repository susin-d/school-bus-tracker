import "dotenv/config";
import { getSupabaseAdminClient } from "../src/lib/supabase.js";

async function checkAssignments() {
  const admin = getSupabaseAdminClient();
  
  const { count: studentCount, error: studentError } = await admin
    .from("students")
    .select("*", { count: "exact", head: true });
    
  const { count: assignmentCount, error: assignmentError } = await admin
    .from("assignments")
    .select("*", { count: "exact", head: true });
    
  const { data: drivers, error: driverError } = await admin
    .from("users")
    .select("id, full_name")
    .eq("role", "driver");

  console.log("Total Students:", studentCount);
  console.log("Total Assignments:", assignmentCount);
  console.log("Total Drivers:", drivers?.length);
  
  if (assignmentCount === 0 && studentCount > 0) {
    console.log("Students exist but no assignments found.");
  }
}

checkAssignments().catch(console.error);
