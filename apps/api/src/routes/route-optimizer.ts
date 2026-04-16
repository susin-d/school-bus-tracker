import { Router } from "express";
import { optimizeRoute } from "../lib/route-optimizer";
import { getSupabaseAdminClient } from "../lib/supabase";
import { HttpError } from "../lib/http";

export const routeOptimizerRouter = Router();

// POST /routes/optimize
// Body: { school_id: string }
routeOptimizerRouter.post("/optimize", async (req, res, next) => {
  try {
    const { school_id } = req.body;
    if (!school_id) throw new HttpError(400, "school_id required", "missing_school_id");
    const admin = getSupabaseAdminClient();
    // Get school location
    const { data: school, error: schoolError } = await admin.from("schools").select("latitude,longitude").eq("id", school_id).maybeSingle();
    if (schoolError || !school) throw new HttpError(404, "School not found", "school_not_found");
    // Get students with valid lat/lng
    const { data: students, error: studentError } = await admin.from("students").select("id,latitude,longitude").eq("school_id", school_id).eq("is_active", true);
    if (studentError) throw new HttpError(500, studentError.message, "students_fetch_failed");
    // Optimize route
    const result = optimizeRoute(students, Number(school.latitude), Number(school.longitude));
    res.json(result);
  } catch (err) {
    next(err);
  }
});
