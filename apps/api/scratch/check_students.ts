import { getSupabaseAdminClient } from "../src/lib/supabase.js";

async function checkAssignments() {
  const client = getSupabaseAdminClient();
  
  console.log("Checking Students...");
  const { count: studentCount } = await client.from("students").select("*", { count: "exact", head: true });
  console.log(`Total Students: ${studentCount}`);

  console.log("Checking Drivers...");
  const { count: driverCount } = await client.from("drivers").select("*", { count: "exact", head: true });
  console.log(`Total Drivers: ${driverCount}`);

  console.log("Checking Trip Students Assignments...");
  const { data: assignments, error } = await client
    .from("trip_students")
    .select("trip_id, student_id");
    
  if (error) {
    console.error("Error fetching trip_students:", error);
    return;
  }

  console.log(`Total Assignments (trip_students): ${assignments.length}`);
  
  if (assignments.length > 0) {
    const tripCounts: Record<string, number> = {};
    assignments.forEach(a => {
      tripCounts[a.trip_id] = (tripCounts[a.trip_id] || 0) + 1;
    });
    console.log("Students per Trip:", tripCounts);
  } else {
    console.log("No students assigned to any trip!");
  }
}

checkAssignments();
