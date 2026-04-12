import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

async function checkData() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: trips } = await supabase.from("trips").select("id, status, driver_id");
  const { count: tsCount } = await supabase.from("trip_students").select("*", { count: "exact", head: true });
  const { count: assignCount } = await supabase.from("student_transport_assignments").select("*", { count: "exact", head: true });

  console.log("Trips found:", trips?.length);
  console.log("Trip-Student link entries:", tsCount);
  console.log("Transport assignments (Master):", assignCount);
  
  if (trips && trips.length > 0) {
    const tripId = trips[0].id;
    const { data: students } = await supabase.from("trip_students").select("student_id").eq("trip_id", tripId);
    console.log(`Students for first trip (${tripId}):`, students?.length);
  }
}

checkData().catch(console.error);
