import { optimizeDailyRoutes } from "./map-data.js";
import { getSupabaseAdminClient } from "./supabase.js";

type SchoolPlannerRow = {
  id: string;
  timezone: string | null;
};

function readBooleanEnv(name: string, defaultValue: boolean) {
  const raw = process.env[name];
  if (!raw) {
    return defaultValue;
  }

  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function readNumberEnv(name: string, defaultValue: number) {
  const raw = Number(process.env[name]);
  if (!Number.isFinite(raw) || raw <= 0) {
    return defaultValue;
  }

  return raw;
}

function readPlannerLocalTime() {
  const raw = (process.env.NIGHTLY_PLANNER_LOCAL_TIME ?? "02:00").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw);
  if (!match) {
    return { hour: 2, minute: 0 };
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: 2, minute: 0 };
  }

  return { hour, minute };
}

function getLocalDateParts(timeZone: string, now: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return {
    dateKey: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    hour,
    minute
  };
}

async function listSchools() {
  const { data, error } = await getSupabaseAdminClient()
    .from("schools")
    .select("id, timezone");

  if (error) {
    throw new Error(`nightly planner school query failed: ${error.message}`);
  }

  return (data ?? []) as SchoolPlannerRow[];
}

export async function recordPlannerRun(input: {
  schoolId: string;
  triggerType: "manual" | "automatic";
  status: "success" | "failed";
  processedTrips: number;
  plannedTrips: number;
  skippedTrips: number;
  errorCode?: string;
  errorMessage?: string;
  startedAt: string;
  finishedAt: string;
}) {
  try {
    const client = getSupabaseAdminClient() as unknown as {
      from?: (table: string) => {
        insert: (value: Record<string, unknown>) => Promise<{ error?: unknown }>;
      };
    } | undefined;

    if (!client || typeof client.from !== "function") {
      return;
    }

    const { error } = await client.from("nightly_planner_runs").insert({
      school_id: input.schoolId,
      run_date: input.startedAt.slice(0, 10),
      trigger_type: input.triggerType,
      status: input.status,
      processed_trips: input.processedTrips,
      planned_trips: input.plannedTrips,
      skipped_trips: input.skippedTrips,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
      started_at: input.startedAt,
      finished_at: input.finishedAt
    });

    if (error) {
      console.error("[nightly-planner] failed to persist run history", error);
    }
  } catch (error) {
    console.error("[nightly-planner] run history persistence failed", error);
  }
}

const lastRunBySchoolDate = new Map<string, string>();

async function runNightlyPlannerTick(localHour: number, localMinute: number) {
  const schools = await listSchools();
  const now = new Date();

  for (const school of schools) {
    const schoolId = school.id;
    if (!schoolId) {
      continue;
    }

    const timeZone = school.timezone?.trim() || "UTC";
    let localDate: { dateKey: string; hour: number; minute: number };
    try {
      localDate = getLocalDateParts(timeZone, now);
    } catch {
      localDate = getLocalDateParts("UTC", now);
    }

    const alreadyRan = lastRunBySchoolDate.get(schoolId) === localDate.dateKey;
    const inWindow =
      localDate.hour === localHour &&
      localDate.minute >= localMinute &&
      localDate.minute <= localMinute + 9;

    if (!inWindow || alreadyRan) {
      continue;
    }

    try {
      const startedAt = new Date().toISOString();
      const result = await optimizeDailyRoutes({
        schoolId,
        reason: "nightly_scheduler"
      });
      const finishedAt = new Date().toISOString();
      lastRunBySchoolDate.set(schoolId, localDate.dateKey);
      await recordPlannerRun({
        schoolId,
        triggerType: "automatic",
        status: "success",
        processedTrips: result.processedTrips,
        plannedTrips: result.plannedTrips,
        skippedTrips: result.skippedTrips,
        errorCode: undefined,
        startedAt,
        finishedAt
      });
      console.info(JSON.stringify({
        scope: "planner",
        event: "nightly.success",
        schoolId,
        processedTrips: result.processedTrips,
        plannedTrips: result.plannedTrips,
        skippedTrips: result.skippedTrips,
        routeEngineMode: result.routeEngineMode
      }));
    } catch (error) {
      const finishedAt = new Date().toISOString();
      await recordPlannerRun({
        schoolId,
        triggerType: "automatic",
        status: "failed",
        processedTrips: 0,
        plannedTrips: 0,
        skippedTrips: 0,
        errorCode: "nightly_planner_failed",
        errorMessage: error instanceof Error ? error.message : "Unknown nightly planner error",
        startedAt: finishedAt,
        finishedAt
      });
      console.error(JSON.stringify({
        scope: "planner",
        event: "nightly.failed",
        schoolId,
        errorCode: "nightly_planner_failed",
        errorMessage: error instanceof Error ? error.message : "Unknown nightly planner error"
      }));
    }
  }
}

export function startNightlyPlanner() {
  const enabled = readBooleanEnv("NIGHTLY_PLANNER_ENABLED", true);
  if (!enabled) {
    console.log("[nightly-planner] disabled by NIGHTLY_PLANNER_ENABLED");
    return () => {};
  }

  const intervalSeconds = readNumberEnv("NIGHTLY_PLANNER_INTERVAL_SECONDS", 300);
  const { hour, minute } = readPlannerLocalTime();
  console.log(
    `[nightly-planner] started (target=${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} local school time, interval=${intervalSeconds}s)`
  );

  const timer = setInterval(() => {
    runNightlyPlannerTick(hour, minute).catch((error) => {
      console.error("[nightly-planner] tick failed", error);
    });
  }, intervalSeconds * 1000);

  runNightlyPlannerTick(hour, minute).catch((error) => {
    console.error("[nightly-planner] initial tick failed", error);
  });

  return () => {
    clearInterval(timer);
  };
}
