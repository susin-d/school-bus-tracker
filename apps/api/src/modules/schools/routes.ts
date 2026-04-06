import { Router, type Router as ExpressRouter } from "express";

import type {
  BulkGeocodeResponse,
  OptimizeDailyRoutesResponse,
  SchoolMapSettingsResponse
} from "@school-bus/shared";

import { asyncHandler } from "../../lib/http.js";
import {
  bulkGeocodeStudents,
  getSchoolMapSettings,
  optimizeDailyRoutes,
  upsertSchoolMapSettings
} from "../../lib/map-data.js";
import { recordPlannerRun } from "../../lib/nightly-planner.js";
import {
  bulkGeocodeSchema,
  mapSettingsUpdateSchema,
  optimizeDailyRoutesSchema
} from "../../lib/validation.js";
import { requireRole } from "../../middleware/require-role.js";
import { requireUser } from "../../middleware/require-user.js";

export const schoolsRouter: ExpressRouter = Router();

schoolsRouter.use(requireUser);
schoolsRouter.use(requireRole("admin", "super_admin"));

schoolsRouter.post("/:schoolId/students/geocode-bulk", asyncHandler(async (request, response) => {
  const body = bulkGeocodeSchema.parse(request.body ?? {});
  const payload: BulkGeocodeResponse = await bulkGeocodeStudents({
    actor: request.currentUser!,
    schoolId: String(request.params.schoolId),
    forceRefresh: body.forceRefresh
  });

  response.json(payload);
}));

schoolsRouter.post("/:schoolId/routes/optimize-daily", asyncHandler(async (request, response) => {
  const body = optimizeDailyRoutesSchema.parse(request.body ?? {});
  const schoolId = String(request.params.schoolId);
  const startedAt = new Date().toISOString();
  try {
    const payload: OptimizeDailyRoutesResponse = await optimizeDailyRoutes({
      actor: request.currentUser!,
      schoolId,
      dispatchAt: body.dispatchAt,
      reason: body.reason
    });
    const finishedAt = new Date().toISOString();
    await recordPlannerRun({
      schoolId,
      triggerType: "manual",
      status: "success",
      processedTrips: payload.processedTrips,
      plannedTrips: payload.plannedTrips,
      skippedTrips: payload.skippedTrips,
      errorCode: undefined,
      startedAt,
      finishedAt
    });

    response.json(payload);
  } catch (error) {
    const finishedAt = new Date().toISOString();
    await recordPlannerRun({
      schoolId,
      triggerType: "manual",
      status: "failed",
      processedTrips: 0,
      plannedTrips: 0,
      skippedTrips: 0,
      errorCode: "manual_optimize_failed",
      errorMessage: error instanceof Error ? error.message : "Manual optimization failed",
      startedAt,
      finishedAt
    });
    throw error;
  }
}));

schoolsRouter.get("/:schoolId/map-settings", asyncHandler(async (request, response) => {
  const payload: SchoolMapSettingsResponse = {
    settings: await getSchoolMapSettings({
      actor: request.currentUser!,
      schoolId: String(request.params.schoolId)
    })
  };
  response.json(payload);
}));

schoolsRouter.put("/:schoolId/map-settings", asyncHandler(async (request, response) => {
  const patch = mapSettingsUpdateSchema.parse(request.body ?? {});
  const payload: SchoolMapSettingsResponse = {
    settings: await upsertSchoolMapSettings({
      actor: request.currentUser!,
      schoolId: String(request.params.schoolId),
      patch
    })
  };
  response.json(payload);
}));
