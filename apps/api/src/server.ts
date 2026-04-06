import cors from "cors";
import express, { type Express } from "express";

import {
  alertTypeLabels,
  attendanceEventTypeLabels,
  roleLabels,
  tripStatusLabels
} from "@school-bus/shared";

import { errorHandler } from "./middleware/error-handler.js";
import { verifySupabaseConnection } from "./lib/data.js";
import { getGoogleMapsDependencyStatus } from "./lib/maps.js";
import { getBrevoDependencyStatus } from "./lib/email/brevo.js";
import { adminRouter } from "./modules/admin/routes.js";
import { alertsRouter } from "./modules/alerts/routes.js";
import { attendanceRouter } from "./modules/attendance/routes.js";
import { authRouter } from "./modules/auth/routes.js";
import { leavesRouter } from "./modules/leaves/routes.js";
import { mapsRouter } from "./modules/maps/routes.js";
import { parentsRouter } from "./modules/parents/routes.js";
import { createResourceRouter } from "./modules/resources/routes.js";
import { schoolsRouter } from "./modules/schools/routes.js";
import { studentsRouter } from "./modules/students/routes.js";
import { tripsRouter } from "./modules/trips/routes.js";

export const app: Express = express();

app.use(cors());
app.use(express.json());

app.get("/health", async (_request, response) => {
  try {
    await verifySupabaseConnection();

    response.json({
      status: "ok",
      service: "school-bus-api",
      database: "supabase"
    });
  } catch (error) {
    response.status(500).json({
      status: "error",
      service: "school-bus-api",
      message: error instanceof Error ? error.message : "Unknown Supabase error"
    });
  }
});

app.get("/bootstrap", (_request, response) => {
  response.json({
    roles: roleLabels,
    tripStatuses: tripStatusLabels,
    attendanceEventTypes: attendanceEventTypeLabels,
    alertTypes: alertTypeLabels,
    database: "supabase"
  });
});

app.get("/health/dependencies", async (_request, response) => {
  let supabaseStatus: {
    provider: "supabase";
    status: "ok" | "error";
    error?: string;
  };
  try {
    await verifySupabaseConnection();
    supabaseStatus = {
      provider: "supabase",
      status: "ok"
    };
  } catch (error) {
    supabaseStatus = {
      provider: "supabase",
      status: "error",
      error: error instanceof Error ? error.message : "unknown_supabase_error"
    };
  }

  response.json({
    dependencies: {
      supabase: supabaseStatus,
      googleMaps: getGoogleMapsDependencyStatus(),
      brevo: getBrevoDependencyStatus()
    }
  });
});

app.use("/auth", authRouter);
app.use("/trips", tripsRouter);
app.use("/attendance", attendanceRouter);
app.use("/alerts", alertsRouter);
app.use("/leave-requests", leavesRouter);
app.use("/maps", mapsRouter);
app.use("/parents", parentsRouter);
app.use("/admin", adminRouter);
app.use("/schools", schoolsRouter);
app.use("/students", studentsRouter);
app.use("/schools", createResourceRouter("schools"));
app.use("/users", createResourceRouter("users"));
app.use("/routes", createResourceRouter("routes"));
app.use("/stops", createResourceRouter("stops"));
app.use("/buses", createResourceRouter("buses"));
app.use("/drivers", createResourceRouter("drivers"));
app.use("/assignments", createResourceRouter("assignments"));

app.use((_request, response) => {
  response.status(404).json({
    error: "Endpoint not found",
    code: "not_found"
  });
});

app.use(errorHandler);
