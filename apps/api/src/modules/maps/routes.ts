import { Router, type Request, type Response, type Router as ExpressRouter } from "express";

import type {
  DriversLiveMapResponse,
  RealtimeEventsResponse
} from "@school-bus/shared";

import { asyncHandler, HttpError } from "../../lib/http.js";
import { listLiveDrivers } from "../../lib/map-data.js";
import { listRealtimeEvents, subscribeRealtimeEvents } from "../../lib/realtime.js";
import { assertUserCanAccessTrip, getUserProfileById } from "../../lib/data.js";
import { verifyStreamToken } from "../../lib/stream-token.js";
import { requireUser } from "../../middleware/require-user.js";
import { requireRole } from "../../middleware/require-role.js";

export const mapsRouter: ExpressRouter = Router();

function resolveRealtimeSchoolScope(request: Request) {
  const user = request.currentUser!;
  if (user.role === "super_admin") {
    return typeof request.query.schoolId === "string" ? request.query.schoolId : undefined;
  }

  return user.schoolId;
}

async function ensureTripFilterAccess(request: Request) {
  const tripId = typeof request.query.tripId === "string" ? request.query.tripId : undefined;
  if (!tripId) {
    return undefined;
  }

  await assertUserCanAccessTrip(request.currentUser!, tripId);
  return tripId;
}

mapsRouter.get("/events/stream", asyncHandler(async (request, response) => {
  if (typeof request.query.accessToken === "string" || typeof request.query.userId === "string") {
    throw new HttpError(401, "Query auth is not allowed for stream endpoint", "stream_query_auth_forbidden");
  }

  const rawStreamToken = typeof request.query.streamToken === "string" ? request.query.streamToken : "";
  const tokenPayload = verifyStreamToken(rawStreamToken);
  const tokenUser = await getUserProfileById(tokenPayload.userId);
  if (!tokenUser || tokenUser.role !== tokenPayload.role) {
    throw new HttpError(401, "Invalid stream token user", "invalid_stream_token");
  }

  if (tokenPayload.role !== "super_admin" && tokenUser.schoolId !== tokenPayload.schoolId) {
    throw new HttpError(403, "Stream token school scope mismatch", "stream_scope_forbidden");
  }

  const requestedTripId = typeof request.query.tripId === "string" ? request.query.tripId : undefined;
  if (requestedTripId && tokenPayload.tripId && requestedTripId !== tokenPayload.tripId) {
    throw new HttpError(403, "Stream token trip scope mismatch", "stream_scope_forbidden");
  }

  const requestedSchoolId = typeof request.query.schoolId === "string" ? request.query.schoolId : undefined;
  const tokenSchoolScope = tokenPayload.schoolId?.trim() || undefined;
  if (requestedSchoolId && tokenSchoolScope && requestedSchoolId !== tokenSchoolScope) {
    throw new HttpError(403, "Stream token school scope mismatch", "stream_scope_forbidden");
  }

  const schoolId = requestedSchoolId ?? tokenSchoolScope;
  const tripId = requestedTripId ?? tokenPayload.tripId;
  const since = typeof request.query.since === "string" ? request.query.since : undefined;

  response.setHeader("Content-Type", "text/event-stream");
  response.setHeader("Cache-Control", "no-cache");
  response.setHeader("Connection", "keep-alive");
  response.flushHeaders?.();

  const historical = listRealtimeEvents({ schoolId, tripId, since });
  for (const event of historical) {
    response.write(`data: ${JSON.stringify(event)}\n\n`);
  }

  const heartbeat = setInterval(() => {
    response.write(": keepalive\n\n");
  }, 15000);

  const unsubscribe = subscribeRealtimeEvents((event) => {
    if (schoolId && event.schoolId !== schoolId) {
      return;
    }
    if (tripId && event.tripId !== tripId) {
      return;
    }
    response.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  request.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    response.end();
  });
}));

mapsRouter.use(requireUser);

mapsRouter.get("/schools/:schoolId/drivers/live", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  const schoolId = String(request.params.schoolId);
  const drivers = await listLiveDrivers({
    actor: request.currentUser!,
    schoolId,
    clusterMode: undefined
  });

  const payload: DriversLiveMapResponse = {
    drivers
  };
  response.json(payload);
}));

mapsRouter.get("/super-admin/drivers/live", requireRole("super_admin"), asyncHandler(async (request, response) => {
  const drivers = await listLiveDrivers({
    actor: request.currentUser!,
    clusterMode: request.query.clusterMode === "grid" ? "grid" : undefined
  });

  const payload: DriversLiveMapResponse = {
    drivers
  };
  response.json(payload);
}));

mapsRouter.get("/events", asyncHandler(async (request, response) => {
  const tripId = await ensureTripFilterAccess(request);
  const schoolId = resolveRealtimeSchoolScope(request);
  const since = typeof request.query.since === "string" ? request.query.since : undefined;
  const payload: RealtimeEventsResponse = {
    events: listRealtimeEvents({
      schoolId,
      tripId,
      since
    })
  };

  response.json(payload);
}));

mapsRouter.get("/drivers/live", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  const schoolId =
    request.currentUser!.role === "super_admin" && typeof request.query.schoolId === "string"
      ? request.query.schoolId
      : request.currentUser!.role === "super_admin"
        ? undefined
        : request.currentUser!.schoolId;

  if (!schoolId && request.currentUser!.role !== "super_admin") {
    throw new HttpError(400, "schoolId is required", "missing_school_id");
  }

  const drivers = await listLiveDrivers({
    actor: request.currentUser!,
    schoolId,
    clusterMode: request.currentUser!.role === "super_admin" && request.query.clusterMode === "grid" ? "grid" : undefined
  });

  const payload: DriversLiveMapResponse = {
    drivers
  };
  response.json(payload);
}));
