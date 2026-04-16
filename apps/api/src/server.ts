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
import { routeOptimizerRouter } from "./routes/route-optimizer";

export const app: Express = express();

const ansi = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  red: "\x1b[31m"
};

function colorizeStatusCode(statusCode: number) {
  const color =
    statusCode >= 500
      ? ansi.red
      : statusCode >= 400
        ? ansi.yellow
        : statusCode >= 300
          ? ansi.cyan
          : ansi.green;

  return `${color}${statusCode}${ansi.reset}`;
}

app.use(cors());
app.use(express.json());
app.use((request, response, next) => {
  const startedAt = process.hrtime.bigint();

  response.on("finish", () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const statusCode = colorizeStatusCode(response.statusCode);
    console.log(
      `[api] ${request.method} ${request.originalUrl} ${statusCode} ${elapsedMs.toFixed(1)}ms`
    );
  });

  next();
});

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
app.use("/routes", routeOptimizerRouter);

app.use((_request, response) => {
  response.status(404).json({
    error: "Endpoint not found",
    code: "not_found"
  });
});

app.use(errorHandler);



