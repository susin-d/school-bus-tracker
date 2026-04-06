import { Router, type Router as ExpressRouter } from "express";

import type { AttendanceEventRequest, AttendanceListResponse } from "@school-bus/shared";

import { asyncHandler, HttpError } from "../../lib/http.js";
import { assertUserCanAccessStudent, assertUserCanAccessTrip, assertUserCanRecordAttendance, createAttendanceRecord, getStudentAttendanceHistory, listAttendanceRecords } from "../../lib/data.js";
import { attendanceEventSchema } from "../../lib/validation.js";
import { requireUser } from "../../middleware/require-user.js";
import { requireRole } from "../../middleware/require-role.js";

export const attendanceRouter: ExpressRouter = Router();

attendanceRouter.use(requireUser);

attendanceRouter.get("/:tripId", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const tripId = String(request.params.tripId);
  await assertUserCanAccessTrip(user, tripId);
  const records = await listAttendanceRecords(tripId);
  const payload: AttendanceListResponse = {
    tripId,
    records
  };

  response.json(payload);
}));

attendanceRouter.get("/students/:studentId/history", requireRole("parent", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const studentId = String(request.params.studentId);
  await assertUserCanAccessStudent(user, studentId);
  const history = await getStudentAttendanceHistory(
    studentId,
    user.role === "parent" || user.role === "super_admin" ? undefined : user.schoolId
  );

  response.json({
    studentId,
    history
  });
}));

attendanceRouter.post("/board", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const tripId = request.body.tripId ? String(request.body.tripId) : "";
  if (!tripId) {
    throw new HttpError(400, "tripId is required", "missing_trip_id");
  }
  const body = attendanceEventSchema.parse({
    ...request.body,
    eventType: "boarded"
  });
  await assertUserCanRecordAttendance(user, tripId, body.studentId);

  const record = await createAttendanceRecord({
    tripId,
    studentId: body.studentId,
    eventType: "boarded",
    stopId: body.stopId,
    notes: body.notes,
    recordedByUserId: user.id
  });

  response.status(201).json(record);
}));

attendanceRouter.post("/drop", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const tripId = request.body.tripId ? String(request.body.tripId) : "";
  if (!tripId) {
    throw new HttpError(400, "tripId is required", "missing_trip_id");
  }
  const body = attendanceEventSchema.parse({
    ...request.body,
    eventType: "dropped"
  });
  await assertUserCanRecordAttendance(user, tripId, body.studentId);

  const record = await createAttendanceRecord({
    tripId,
    studentId: body.studentId,
    eventType: "dropped",
    stopId: body.stopId,
    notes: body.notes,
    recordedByUserId: user.id
  });

  response.status(201).json(record);
}));

attendanceRouter.post("/:tripId", requireRole("driver", "admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const tripId = String(request.params.tripId);
  const body = attendanceEventSchema.parse(request.body as Partial<AttendanceEventRequest>);
  await assertUserCanRecordAttendance(user, tripId, body.studentId);

  const record = await createAttendanceRecord({
    tripId,
    studentId: body.studentId,
    eventType: body.eventType,
    stopId: body.stopId,
    notes: body.notes,
    recordedByUserId: user.id
  });

  response.status(201).json(record);
}));
