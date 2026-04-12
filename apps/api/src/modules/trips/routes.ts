import { Router, type Router as ExpressRouter } from "express";

import type {
  CurrentTripResponse,
  StopActionResponse,
  TripLocationResponse,
  TripManifestResponse,
  UpdateTripStatusRequest
} from "@school-bus/shared";

import { asyncHandler, HttpError } from "../../lib/http.js";
import { getTripManifest, markTripStop, refreshTripEtasFromCurrentLocation, reoptimizeTrip } from "../../lib/map-data.js";
import { publishRealtimeEvent } from "../../lib/realtime.js";
import { reassignDriverSchema, reoptimizeTripSchema, stopBoardedSchema, tripIncidentSchema, tripLocationSchema, tripStatusSchema } from "../../lib/validation.js";
import {
  addTripLocation,
  assertUserCanAccessTrip,
  createAlert,
  getCurrentTripForUser,
  getTripById,
  getTripLocation,
  reassignTripDriver,
  updateTripStatus
} from "../../lib/data.js";
import { requireUser } from "../../middleware/require-user.js";
import { requireRole } from "../../middleware/require-role.js";

export const tripsRouter: ExpressRouter = Router();

tripsRouter.use(requireUser);

tripsRouter.get("/current", asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const result = await getCurrentTripForUser(user);

  const payload: CurrentTripResponse = {
    trip: result.trip ? { ...result.trip, studentCount: result.students.length } : null,
    students: result.students,
    lastLocation: result.lastLocation
  };

  response.json(payload);
}));

tripsRouter.get("/:tripId/location", asyncHandler(async (request, response) => {
  const tripId = String(request.params.tripId);
  const user = request.currentUser!;
  const trip = await getTripById(tripId);
  if (!trip) {
    throw new HttpError(404, "Trip not found", "trip_not_found");
  }
  await assertUserCanAccessTrip(user, tripId);

  const payload: TripLocationResponse = {
    tripId,
    status: trip.status,
    location: await getTripLocation(tripId)
  };

  response.json(payload);
}));

tripsRouter.get("/:tripId/manifest", asyncHandler(async (request, response) => {
  const payload: TripManifestResponse = await getTripManifest({
    actor: request.currentUser!,
    tripId: String(request.params.tripId)
  });

  response.json(payload);
}));

tripsRouter.post("/:tripId/start", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const tripId = String(request.params.tripId);
  await assertUserCanAccessTrip(user, tripId);
  await updateTripStatus(tripId, "active", user.id);
  response.json({
    ok: true,
    tripId,
    status: "active"
  });
}));

tripsRouter.post("/:tripId/end", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const tripId = String(request.params.tripId);
  await assertUserCanAccessTrip(user, tripId);
  await updateTripStatus(tripId, "completed", user.id);
  response.json({
    ok: true,
    tripId,
    status: "completed"
  });
}));

tripsRouter.post("/:tripId/status", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const tripId = String(request.params.tripId);
  const body = tripStatusSchema.parse(request.body as Partial<UpdateTripStatusRequest>);

  await assertUserCanAccessTrip(user, tripId);
  await updateTripStatus(tripId, body.status, user.id);
  response.json({
    ok: true,
    tripId,
    status: body.status
  });
}));

tripsRouter.post("/:tripId/location", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const tripId = String(request.params.tripId);
  const body = tripLocationSchema.parse(request.body);
  const trip = await assertUserCanAccessTrip(user, tripId);
  await addTripLocation({
    tripId,
    latitude: body.latitude,
    longitude: body.longitude,
    speedKph: body.speedKph,
    heading: body.heading,
    recordedAt: body.recordedAt ?? new Date().toISOString(),
    actorUserId: user.id
  });
  publishRealtimeEvent({
    type: "trip.location.updated",
    schoolId: trip.schoolId,
    tripId,
    payload: {
      latitude: body.latitude,
      longitude: body.longitude,
      speedKph: body.speedKph ?? null,
      heading: body.heading ?? null
    }
  });
  await refreshTripEtasFromCurrentLocation({
    tripId,
    reason: "location_update",
    schoolId: trip.schoolId
  });

  response.status(201).json({
    ok: true,
    tripId
  });
}));

tripsRouter.post("/:tripId/reoptimize", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const body = reoptimizeTripSchema.parse(request.body ?? {});
  const result = await reoptimizeTrip({
    actor: request.currentUser!,
    tripId: String(request.params.tripId),
    reason: body.reason
  });
  console.info(JSON.stringify({
    scope: "routing",
    event: "reoptimize.manual",
    tripId: String(request.params.tripId),
    actorRole: request.currentUser!.role,
    reason: body.reason ?? "manual"
  }));

  response.json(result);
}));

tripsRouter.post("/:tripId/incidents/major-delay", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const body = tripIncidentSchema.parse(request.body ?? {});
  const user = request.currentUser!;
  const tripId = String(request.params.tripId);
  const trip = await assertUserCanAccessTrip(user, tripId);
  await createAlert({
    schoolId: trip.schoolId,
    tripId,
    type: "delay",
    severity: "high",
    message: body.message?.trim() || "Major traffic delay reported on route",
    triggeredByUserId: user.id
  });

  const result = await reoptimizeTrip({
    actor: user,
    tripId,
    reason: body.reason?.trim() || "major_traffic_delay"
  });
  console.info(JSON.stringify({
    scope: "routing",
    event: "reoptimize.major_delay",
    tripId,
    schoolId: trip.schoolId,
    actorRole: user.role
  }));
  response.json(result);
}));

tripsRouter.post("/:tripId/incidents/breakdown", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const body = tripIncidentSchema.parse(request.body ?? {});
  const user = request.currentUser!;
  const tripId = String(request.params.tripId);
  const trip = await assertUserCanAccessTrip(user, tripId);
  await updateTripStatus(tripId, "paused", user.id);
  await createAlert({
    schoolId: trip.schoolId,
    tripId,
    type: "route_deviation",
    severity: "critical",
    message: body.message?.trim() || "Vehicle breakdown reported",
    triggeredByUserId: user.id
  });

  const result = await reoptimizeTrip({
    actor: user,
    tripId,
    reason: body.reason?.trim() || "vehicle_breakdown"
  });
  console.info(JSON.stringify({
    scope: "routing",
    event: "reoptimize.breakdown",
    tripId,
    schoolId: trip.schoolId,
    actorRole: user.role
  }));
  response.json(result);
}));

tripsRouter.post("/:tripId/reassign-driver", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const tripId = String(request.params.tripId);
  const body = reassignDriverSchema.parse(request.body ?? {});
  const updatedTrip = await reassignTripDriver({
    actor: user,
    tripId,
    driverId: body.driverId
  });

  const reoptimized = await reoptimizeTrip({
    actor: user,
    tripId,
    reason: "vehicle_reassignment"
  });
  console.info(JSON.stringify({
    scope: "routing",
    event: "reoptimize.reassignment",
    tripId,
    schoolId: updatedTrip.schoolId,
    actorRole: user.role,
    driverId: updatedTrip.driverId
  }));

  publishRealtimeEvent({
    type: "trip.reoptimized",
    schoolId: updatedTrip.schoolId,
    tripId,
    payload: {
      reason: "vehicle_reassignment",
      driverId: updatedTrip.driverId,
      driverName: updatedTrip.driverName,
      routeVersion: reoptimized.routeVersion
    }
  });

  response.json({
    trip: updatedTrip,
    reoptimized
  });
}));

tripsRouter.post("/:tripId/stops/:stopId/arrived", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const result: StopActionResponse = await markTripStop({
    actor: request.currentUser!,
    tripId: String(request.params.tripId),
    stopId: String(request.params.stopId),
    action: "arrived"
  });

  response.json(result);
}));

tripsRouter.post("/:tripId/stops/:stopId/boarded", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const body = stopBoardedSchema.parse(request.body ?? {});
  const result: StopActionResponse = await markTripStop({
    actor: request.currentUser!,
    tripId: String(request.params.tripId),
    stopId: String(request.params.stopId),
    action: "boarded",
    notes: body.notes
  });

  response.json(result);
}));

tripsRouter.post("/:tripId/stops/:stopId/no-show", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const body = stopBoardedSchema.parse(request.body ?? {});
  const result: StopActionResponse = await markTripStop({
    actor: request.currentUser!,
    tripId: String(request.params.tripId),
    stopId: String(request.params.stopId),
    action: "no_show",
    notes: body.notes
  });

  response.json(result);
}));
