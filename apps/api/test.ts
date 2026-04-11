import { getSupabaseAdminClient } from "./src/lib/supabase.js";

async function run() {
  const { data: routes } = await getSupabaseAdminClient().from("routes").select("*").limit(1);
  console.log("Route columns:", routes?.length ? Object.keys(routes[0]) : "no rows");
  
  const { data: buses } = await getSupabaseAdminClient().from("buses").select("*").limit(1);
  console.log("Bus columns:", buses?.length ? Object.keys(buses[0]) : "no rows");
  
  const { data: trips } = await getSupabaseAdminClient().from("trips").select("*").limit(1);
  console.log("Trip columns:", trips?.length ? Object.keys(trips[0]) : "no rows");
  
  const { data: students } = await getSupabaseAdminClient().from("students").select("*").limit(1);
  console.log("Student columns:", students?.length ? Object.keys(students[0]) : "no rows");
  
  const { data: tripStudents } = await getSupabaseAdminClient().from("trip_students").select("*").limit(1);
  console.log("Trip student columns:", tripStudents?.length ? Object.keys(tripStudents[0]) : "no rows");
}

run().catch(console.error);
