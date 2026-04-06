import { Router, type Router as ExpressRouter } from "express";

import type { AlertListResponse, CreateAlertRequest, ResolveAlertRequest } from "@school-bus/shared";

import { assertUserCanAccessAlert, createAlert, listAlerts, updateAlertStatus } from "../../lib/data.js";
import { asyncHandler } from "../../lib/http.js";
import { alertCreateSchema, alertResolutionSchema } from "../../lib/validation.js";
import { requireRole } from "../../middleware/require-role.js";
import { requireUser } from "../../middleware/require-user.js";

export const alertsRouter: ExpressRouter = Router();

alertsRouter.use(requireUser);

alertsRouter.get("/", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const schoolId =
    user.role === "super_admin" && typeof request.query.schoolId === "string"
      ? request.query.schoolId
      : user.role === "super_admin"
        ? undefined
        : user.schoolId;
  const payload: AlertListResponse = {
    alerts: await listAlerts(schoolId)
  };

  response.json(payload);
}));

alertsRouter.get("/feed", asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const schoolId =
    user.role === "super_admin" && typeof request.query.schoolId === "string"
      ? request.query.schoolId
      : user.role === "super_admin"
        ? undefined
        : user.schoolId;

  const payload: AlertListResponse = {
    alerts: await listAlerts(schoolId)
  };

  response.json(payload);
}));

alertsRouter.post("/sos", asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const body = alertCreateSchema.parse({
    ...request.body,
    type: "sos",
    severity: request.body.severity ?? "critical"
  } as Partial<CreateAlertRequest>);

  const alert = await createAlert({
    schoolId: user.schoolId,
    tripId: body.tripId,
    type: "sos",
    severity: body.severity ?? "critical",
    message: body.message,
    triggeredByUserId: user.id
  });

  response.status(201).json(alert);
}));

alertsRouter.post("/delay", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const body = alertCreateSchema.parse({
    ...request.body,
    type: "delay",
    severity: request.body.severity ?? "medium"
  } as Partial<CreateAlertRequest>);

  const alert = await createAlert({
    schoolId: user.schoolId,
    tripId: body.tripId,
    type: "delay",
    severity: body.severity ?? "medium",
    message: body.message,
    triggeredByUserId: user.id
  });

  response.status(201).json(alert);
}));

alertsRouter.post("/:alertId/acknowledge", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  await assertUserCanAccessAlert(request.currentUser!, String(request.params.alertId));
  const alert = await updateAlertStatus({
    alertId: String(request.params.alertId),
    status: "acknowledged"
  });

  response.json(alert);
}));

alertsRouter.post("/:alertId/resolve", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  await assertUserCanAccessAlert(request.currentUser!, String(request.params.alertId));
  const body = alertResolutionSchema.parse(request.body as Partial<ResolveAlertRequest>);
  const alert = await updateAlertStatus({
    alertId: String(request.params.alertId),
    status: "resolved",
    resolutionNote: body.resolutionNote
  });

  response.json(alert);
}));
