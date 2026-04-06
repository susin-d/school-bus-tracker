import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UserProfile } from "@school-bus/shared";

import { HttpError } from "../src/lib/http.js";

const state = vi.hoisted(() => ({
  users: {} as Record<string, UserProfile>,
  currentTrip: {
    trip: {
      id: "trip-1",
      schoolId: "school-1",
      routeName: "Route A",
      busLabel: "Bus 12",
      driverName: "Driver Dan",
      status: "active" as const
    },
    students: [
      {
        id: "student-1",
        fullName: "Riya",
        grade: "5",
        assignedBusLabel: "Bus 12",
        assignedRouteName: "Route A"
      }
    ],
    lastLocation: {
      latitude: 12.9,
      longitude: 77.6,
      recordedAt: "2026-04-04T10:00:00.000Z"
    }
  },
  tripLocation: {
    latitude: 12.9,
    longitude: 77.6,
    recordedAt: "2026-04-04T10:00:00.000Z"
  },
  attendanceRecords: [
    {
      id: "attendance-1",
      studentId: "student-1",
      studentName: "Riya",
      eventType: "boarded" as const,
      recordedAt: "2026-04-04T10:00:00.000Z",
      recordedByUserId: "driver-1"
    }
  ],
  studentHistory: [
    {
      id: "attendance-1",
      student_id: "student-1",
      event_type: "boarded"
    }
  ],
  alerts: [
    {
      id: "alert-1",
      schoolId: "school-1",
      type: "delay" as const,
      severity: "medium" as const,
      status: "open" as const,
      message: "Traffic delay",
      triggeredByUserId: "driver-1",
      createdAt: "2026-04-04T10:00:00.000Z"
    }
  ],
  leaveRequests: [] as unknown[],
  tripForbiddenFor: new Set<string>(),
  studentForbiddenFor: new Set<string>(),
  alertForbiddenFor: new Set<string>()
}));

const dataMocks = vi.hoisted(() => ({
  getUserProfileById: vi.fn(async (userId: string) => state.users[userId] ?? null),
  getUserProfileByAuthUserId: vi.fn(async (authUserId: string) => state.users[authUserId] ?? null),
  verifySupabaseConnection: vi.fn(async () => undefined),
  getCurrentTripForUser: vi.fn(async () => state.currentTrip),
  getTripById: vi.fn(async (tripId: string) =>
    tripId === "trip-1" ? state.currentTrip.trip : null
  ),
  getTripLocation: vi.fn(async () => state.tripLocation),
  assertUserCanAccessTrip: vi.fn(async (user: UserProfile, tripId: string) => {
    if (state.tripForbiddenFor.has(`${user.id}:${tripId}`)) {
      throw new HttpError(403, "You cannot access this trip", "trip_access_forbidden");
    }

    return state.currentTrip.trip;
  }),
  assertUserCanRecordAttendance: vi.fn(async (user: UserProfile, tripId: string) => {
    if (state.tripForbiddenFor.has(`${user.id}:${tripId}`)) {
      throw new HttpError(403, "You cannot record attendance for this trip", "attendance_write_forbidden");
    }

    return state.currentTrip.trip;
  }),
  updateTripStatus: vi.fn(async () => undefined),
  reassignTripDriver: vi.fn(async (input: { tripId: string; driverId: string }) => ({
    id: input.tripId,
    schoolId: "school-1",
    routeName: "Route A",
    busLabel: "Bus 12",
    driverId: input.driverId,
    driverName: "Driver Neo",
    status: "active" as const
  })),
  addTripLocation: vi.fn(async () => undefined),
  listAttendanceRecords: vi.fn(async () => state.attendanceRecords),
  assertUserCanAccessStudent: vi.fn(async (user: UserProfile, studentId: string) => {
    if (state.studentForbiddenFor.has(`${user.id}:${studentId}`)) {
      throw new HttpError(403, "You cannot access this student", "student_access_forbidden");
    }
  }),
  createAttendanceRecord: vi.fn(async (input: { studentId: string; eventType: string; recordedByUserId: string }) => ({
    id: "attendance-created",
    studentId: input.studentId,
    eventType: input.eventType,
    recordedAt: "2026-04-04T10:05:00.000Z",
    recordedByUserId: input.recordedByUserId
  })),
  getStudentAttendanceHistory: vi.fn(async () => state.studentHistory),
  createAlert: vi.fn(async (input: { schoolId: string; type: string; message: string; triggeredByUserId: string }) => ({
    id: "alert-created",
    schoolId: input.schoolId,
    type: input.type,
    severity: "medium",
    status: "open",
    message: input.message,
    triggeredByUserId: input.triggeredByUserId,
    createdAt: "2026-04-04T10:00:00.000Z"
  })),
  listAlerts: vi.fn(async () => state.alerts),
  assertUserCanAccessAlert: vi.fn(async (user: UserProfile, alertId: string) => {
    if (state.alertForbiddenFor.has(`${user.id}:${alertId}`)) {
      throw new HttpError(403, "You cannot access this alert", "alert_access_forbidden");
    }
  }),
  updateAlertStatus: vi.fn(async ({ alertId, status }: { alertId: string; status: "acknowledged" | "resolved" }) => ({
    id: alertId,
    schoolId: "school-1",
    type: "delay",
    severity: "medium",
    status,
    message: "Traffic delay",
    triggeredByUserId: "driver-1",
    createdAt: "2026-04-04T10:00:00.000Z"
  })),
  createLeaveRequest: vi.fn(async (input: { studentId: string; requestedByParentId: string }) => ({
    id: "leave-1",
    studentId: input.studentId,
    requestedByParentId: input.requestedByParentId,
    leaveDate: "2026-04-05",
    tripKind: "pickup",
    status: "pending",
    createdAt: "2026-04-04T10:00:00.000Z"
  })),
  listLeaveRequests: vi.fn(async () => state.leaveRequests),
  updateLeaveRequestStatus: vi.fn(async (input: { leaveRequestId: string; status: "approved" | "rejected" }) => ({
    id: input.leaveRequestId,
    studentId: "student-1",
    requestedByParentId: "parent-1",
    leaveDate: "2026-04-05T00:00:00.000Z",
    tripKind: "pickup",
    status: input.status,
    createdAt: "2026-04-04T10:00:00.000Z"
  })),
  getDashboardSummary: vi.fn(async () => ({
    activeTrips: 1,
    delayedTrips: 1,
    unresolvedAlerts: 1,
    onboardStudents: 12
  })),
  listNightlyPlannerRuns: vi.fn(async () => [
    {
      id: "planner-1",
      schoolId: "school-1",
      runDate: "2026-04-04",
      triggerType: "automatic",
      status: "success",
      processedTrips: 2,
      plannedTrips: 2,
      skippedTrips: 0,
      startedAt: "2026-04-04T02:00:00.000Z",
      finishedAt: "2026-04-04T02:01:00.000Z"
    }
  ]),
  listAdminResources: vi.fn(async (resource: string, schoolId?: string, filters: Record<string, string> = {}) => [
    { resource, schoolId: schoolId ?? null, filters }
  ]),
  createAdminResource: vi.fn(async (_resource: string, schoolId: string | undefined, payload: Record<string, unknown>) => ({
    id: "created-1",
    school_id: schoolId ?? null,
    ...payload
  })),
  updateAdminResource: vi.fn(async (_resource: string, resourceId: string, schoolId: string | undefined, payload: Record<string, unknown>) => ({
    id: resourceId,
    school_id: schoolId ?? null,
    ...payload
  })),
  deleteAdminResource: vi.fn(async () => undefined)
}));

const mapDataMocks = vi.hoisted(() => ({
  geocodeStudentAddress: vi.fn(async (input: { studentId: string }) => ({
    studentId: input.studentId,
    geocodeStatus: "resolved",
    latitude: 12.9,
    longitude: 77.6
  })),
  bulkGeocodeStudents: vi.fn(async (input: { schoolId: string }) => ({
    schoolId: input.schoolId,
    totalStudents: 1,
    successCount: 1,
    failureCount: 0,
    results: [
      {
        studentId: "student-1",
        geocodeStatus: "resolved",
        latitude: 12.9,
        longitude: 77.6
      }
    ]
  })),
  optimizeDailyRoutes: vi.fn(async (input: { schoolId: string }) => ({
    schoolId: input.schoolId,
    processedTrips: 1,
    plannedTrips: 1,
    skippedTrips: 0,
    tripIds: ["trip-1"],
    routeEngineMode: "google_waypoint"
  })),
  getSchoolMapSettings: vi.fn(async (input: { schoolId: string }) => ({
    schoolId: input.schoolId,
    dispatchStartTime: "2026-04-04T02:00:00.000Z",
    noShowWaitSeconds: 120,
    maxDetourMinutes: 15
  })),
  upsertSchoolMapSettings: vi.fn(async (input: { schoolId: string; patch: Record<string, unknown> }) => ({
    schoolId: input.schoolId,
    dispatchStartTime: "2026-04-04T02:00:00.000Z",
    noShowWaitSeconds: Number(input.patch.noShowWaitSeconds ?? 120),
    maxDetourMinutes: Number(input.patch.maxDetourMinutes ?? 15)
  })),
  getTripManifest: vi.fn(async (input: { tripId: string }) => ({
    tripId: input.tripId,
    routeVersion: 1,
    generatedAt: "2026-04-04T10:00:00.000Z",
    stops: [
      {
        id: "stop-1",
        tripId: input.tripId,
        schoolId: "school-1",
        sequence: 1,
        studentId: "student-1",
        studentName: "Riya",
        latitude: 12.9,
        longitude: 77.6,
        stopStatus: "scheduled",
        currentEta: "2026-04-04T10:15:00.000Z"
      }
    ]
  })),
  markTripStop: vi.fn(async (input: { tripId: string; stopId: string; action: string }) => ({
    ok: true,
    tripId: input.tripId,
    stopId: input.stopId,
    stopStatus: input.action === "arrived" ? "arrived" : input.action === "boarded" ? "boarded" : "no_show",
    reoptimized: input.action === "no_show"
  })),
  reoptimizeTrip: vi.fn(async (input: { tripId: string }) => ({
    tripId: input.tripId,
    hasPlan: true,
    stopCount: 1,
    routeVersion: 2,
    routeEngineMode: "google_waypoint"
  })),
  refreshTripEtasFromCurrentLocation: vi.fn(async () => undefined),
  listLiveDrivers: vi.fn(async () => [
    {
      tripId: "trip-1",
      schoolId: "school-1",
      driverId: "driver-1",
      driverName: "Driver Dev",
      status: "active",
      latitude: 12.9,
      longitude: 77.6,
      isDelayed: false
    }
  ]),
  getParentLiveTrip: vi.fn(async (input: { studentId: string }) => ({
    studentId: input.studentId,
    trip: state.currentTrip.trip,
    busLocation: state.tripLocation,
    studentStop: {
      id: "stop-1",
      tripId: "trip-1",
      schoolId: "school-1",
      sequence: 1,
      studentId: input.studentId,
      studentName: "Riya",
      latitude: 12.9,
      longitude: 77.6,
      stopStatus: "scheduled",
      currentEta: "2026-04-04T10:15:00.000Z"
    },
    nextStop: null,
    estimatedDropoffAt: "2026-04-04T10:15:00.000Z",
    lastUpdatedAt: "2026-04-04T10:00:00.000Z"
  }))
}));

const supabaseMocks = vi.hoisted(() => ({
  getSupabaseUser: vi.fn(async (accessToken: string) => ({ id: accessToken })),
  getSupabaseAdminClient: vi.fn(),
  getSupabasePublicClient: vi.fn()
}));

vi.mock("../src/lib/data.js", () => dataMocks);
vi.mock("../src/lib/map-data.js", () => mapDataMocks);
vi.mock("../src/lib/supabase.js", () => supabaseMocks);

const { app } = await import("../src/server.js");

function createUser(partial: Partial<UserProfile> & Pick<UserProfile, "id" | "role">): UserProfile {
  return {
    id: partial.id,
    schoolId: partial.schoolId ?? "school-1",
    role: partial.role,
    fullName: partial.fullName ?? partial.id,
    phoneE164: partial.phoneE164 ?? "+910000000000",
    email: partial.email
  };
}

describe("role-based access control", () => {
  beforeEach(() => {
    state.users = {
      "parent-1": createUser({ id: "parent-1", role: "parent", fullName: "Parent Priya" }),
      "driver-1": createUser({ id: "driver-1", role: "driver", fullName: "Driver Dev" }),
      "admin-1": createUser({ id: "admin-1", role: "admin", fullName: "Admin Aditi" }),
      "super-1": createUser({
        id: "super-1",
        role: "super_admin",
        schoolId: "",
        fullName: "Super Sam"
      })
    };
    state.tripForbiddenFor = new Set<string>();
    state.studentForbiddenFor = new Set<string>();
    state.alertForbiddenFor = new Set<string>();
    state.leaveRequests = [];
    vi.clearAllMocks();
  });

  it("lets a parent read the current trip for linked students", async () => {
    const response = await request(app)
      .get("/trips/current")
      .set("x-user-id", "parent-1");

    expect(response.status).toBe(200);
    expect(response.body.trip.id).toBe("trip-1");
    expect(response.body.students).toHaveLength(1);
  });

  it("blocks a parent from changing trip status", async () => {
    const response = await request(app)
      .post("/trips/trip-1/status")
      .set("x-user-id", "parent-1")
      .send({ status: "active" });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("forbidden");
  });

  it("lets a parent create a leave request only through the parent path", async () => {
    const response = await request(app)
      .post("/leave-requests")
      .set("x-user-id", "parent-1")
      .send({
        studentId: "student-1",
        leaveDate: "2026-04-05T00:00:00.000Z",
        tripKind: "pickup",
        reason: "Medical appointment"
      });

    expect(response.status).toBe(201);
    expect(dataMocks.assertUserCanAccessStudent).toHaveBeenCalledWith(
      expect.objectContaining({ id: "parent-1", role: "parent" }),
      "student-1"
    );
  });

  it("blocks a driver from reading parent-only student history", async () => {
    const response = await request(app)
      .get("/attendance/students/student-1/history")
      .set("x-user-id", "driver-1");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("forbidden");
  });

  it("lets a driver list attendance for an assigned trip", async () => {
    const response = await request(app)
      .get("/attendance/trip-1")
      .set("x-user-id", "driver-1");

    expect(response.status).toBe(200);
    expect(response.body.records).toHaveLength(1);
    expect(dataMocks.assertUserCanAccessTrip).toHaveBeenCalledWith(
      expect.objectContaining({ id: "driver-1", role: "driver" }),
      "trip-1"
    );
  });

  it("blocks a school admin from acknowledging another school's alert", async () => {
    state.alertForbiddenFor.add("admin-1:alert-2");

    const response = await request(app)
      .post("/alerts/alert-2/acknowledge")
      .set("x-user-id", "admin-1");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("alert_access_forbidden");
  });

  it("lets a parent read alert feed scoped to their school", async () => {
    const response = await request(app)
      .get("/alerts/feed")
      .set("x-user-id", "parent-1");

    expect(response.status).toBe(200);
    expect(response.body.alerts).toHaveLength(1);
    expect(dataMocks.listAlerts).toHaveBeenCalledWith("school-1");
  });

  it("requires authentication for alert feed", async () => {
    const response = await request(app)
      .get("/alerts/feed");

    expect(response.status).toBe(401);
    expect(response.body.code).toBe("missing_authentication");
  });

  it("lets an admin update leave request status", async () => {
    const response = await request(app)
      .post("/leave-requests/leave-1/status")
      .set("x-user-id", "admin-1")
      .send({
        status: "approved"
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("approved");
    expect(dataMocks.updateLeaveRequestStatus).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "admin-1", role: "admin" }),
      leaveRequestId: "leave-1",
      status: "approved"
    });
  });

  it("blocks parent leave status update", async () => {
    const response = await request(app)
      .post("/leave-requests/leave-1/status")
      .set("x-user-id", "parent-1")
      .send({
        status: "approved"
      });

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("forbidden");
  });

  it("lets a school admin list school-scoped resources", async () => {
    const response = await request(app)
      .get("/admin/users?role=driver")
      .set("x-user-id", "admin-1");

    expect(response.status).toBe(200);
    expect(dataMocks.listAdminResources).toHaveBeenCalledWith(
      "users",
      "school-1",
      { role: "driver" }
    );
  });

  it("returns planner run history scoped by role", async () => {
    const adminResponse = await request(app)
      .get("/admin/planner-runs?limit=5")
      .set("x-user-id", "admin-1");

    expect(adminResponse.status).toBe(200);
    expect(dataMocks.listNightlyPlannerRuns).toHaveBeenCalledWith({
      schoolId: "school-1",
      limit: 5
    });

    const superResponse = await request(app)
      .get("/admin/planner-runs?limit=10")
      .set("x-user-id", "super-1");

    expect(superResponse.status).toBe(200);
    expect(dataMocks.listNightlyPlannerRuns).toHaveBeenCalledWith({
      schoolId: undefined,
      limit: 10
    });
  });

  it("lets a super admin list resources without school scoping", async () => {
    const response = await request(app)
      .get("/admin/users?role=admin")
      .set("x-user-id", "super-1");

    expect(response.status).toBe(200);
    expect(dataMocks.listAdminResources).toHaveBeenCalledWith(
      "users",
      undefined,
      { role: "admin" }
    );
  });

  it("lets an admin run school CRUD through resource endpoints with school scoping", async () => {
    const createResponse = await request(app)
      .post("/schools")
      .set("x-user-id", "admin-1")
      .send({
        name: "Alpha School",
        timezone: "Asia/Kolkata"
      });

    expect(createResponse.status).toBe(201);
    expect(dataMocks.createAdminResource).toHaveBeenCalledWith(
      "schools",
      "school-1",
      expect.objectContaining({
        name: "Alpha School",
        timezone: "Asia/Kolkata"
      })
    );

    const updateResponse = await request(app)
      .put("/schools/school-55")
      .set("x-user-id", "admin-1")
      .send({
        name: "Alpha School Updated"
      });

    expect(updateResponse.status).toBe(200);
    expect(dataMocks.updateAdminResource).toHaveBeenCalledWith(
      "schools",
      "school-55",
      "school-1",
      expect.objectContaining({
        name: "Alpha School Updated"
      })
    );

    const deleteResponse = await request(app)
      .delete("/schools/school-55")
      .set("x-user-id", "admin-1");

    expect(deleteResponse.status).toBe(204);
    expect(dataMocks.deleteAdminResource).toHaveBeenCalledWith(
      "schools",
      "school-55",
      "school-1"
    );
  });

  it("lets a super admin request cross-school user data with explicit school scope", async () => {
    const response = await request(app)
      .get("/users?schoolId=school-2&role=driver")
      .set("x-user-id", "super-1");

    expect(response.status).toBe(200);
    expect(dataMocks.listAdminResources).toHaveBeenCalledWith(
      "users",
      "school-2",
      { role: "driver" }
    );
  });

  it("blocks parent access to admin resource endpoints", async () => {
    const response = await request(app)
      .get("/users")
      .set("x-user-id", "parent-1");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("forbidden");
  });

  it("lets driver perform trip control endpoints", async () => {
    const startResponse = await request(app)
      .post("/trips/trip-1/start")
      .set("x-user-id", "driver-1");
    expect(startResponse.status).toBe(200);

    const statusResponse = await request(app)
      .post("/trips/trip-1/status")
      .set("x-user-id", "driver-1")
      .send({
        status: "paused"
      });
    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body.status).toBe("paused");

    const locationResponse = await request(app)
      .post("/trips/trip-1/location")
      .set("x-user-id", "driver-1")
      .send({
        latitude: 12.98,
        longitude: 77.61,
        speedKph: 35
      });
    expect(locationResponse.status).toBe(201);

    const endResponse = await request(app)
      .post("/trips/trip-1/end")
      .set("x-user-id", "driver-1");
    expect(endResponse.status).toBe(200);

    expect(dataMocks.updateTripStatus).toHaveBeenCalledWith("trip-1", "active", "driver-1");
    expect(dataMocks.updateTripStatus).toHaveBeenCalledWith("trip-1", "paused", "driver-1");
    expect(dataMocks.updateTripStatus).toHaveBeenCalledWith("trip-1", "completed", "driver-1");
    expect(dataMocks.addTripLocation).toHaveBeenCalledWith(
      expect.objectContaining({
        tripId: "trip-1",
        actorUserId: "driver-1",
        latitude: 12.98,
        longitude: 77.61
      })
    );
  });

  it("blocks parent trip-control actions", async () => {
    const response = await request(app)
      .post("/trips/trip-1/start")
      .set("x-user-id", "parent-1");

    expect(response.status).toBe(403);
    expect(response.body.code).toBe("forbidden");
  });

  it("lets driver create delay alert and blocks parent from doing so", async () => {
    const driverResponse = await request(app)
      .post("/alerts/delay")
      .set("x-user-id", "driver-1")
      .send({
        tripId: "trip-1",
        message: "Heavy traffic near school",
        severity: "high"
      });

    expect(driverResponse.status).toBe(201);
    expect(dataMocks.createAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        schoolId: "school-1",
        tripId: "trip-1",
        type: "delay",
        severity: "high",
        triggeredByUserId: "driver-1"
      })
    );

    const parentResponse = await request(app)
      .post("/alerts/delay")
      .set("x-user-id", "parent-1")
      .send({
        tripId: "trip-1",
        message: "Attempted unauthorized delay"
      });

    expect(parentResponse.status).toBe(403);
    expect(parentResponse.body.code).toBe("forbidden");
  });

  it("lets admin resolve an alert", async () => {
    const response = await request(app)
      .post("/alerts/alert-1/resolve")
      .set("x-user-id", "admin-1")
      .send({
        resolutionNote: "Driver rerouted and ETA normalized"
      });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("resolved");
    expect(dataMocks.updateAlertStatus).toHaveBeenCalledWith({
      alertId: "alert-1",
      status: "resolved",
      resolutionNote: "Driver rerouted and ETA normalized"
    });
  });

  it("lets driver submit attendance board/drop events and blocks parent", async () => {
    const boardResponse = await request(app)
      .post("/attendance/board")
      .set("x-user-id", "driver-1")
      .send({
        tripId: "trip-1",
        studentId: "student-1"
      });
    expect(boardResponse.status).toBe(201);

    const dropResponse = await request(app)
      .post("/attendance/drop")
      .set("x-user-id", "driver-1")
      .send({
        tripId: "trip-1",
        studentId: "student-1"
      });
    expect(dropResponse.status).toBe(201);

    const parentAttempt = await request(app)
      .post("/attendance/board")
      .set("x-user-id", "parent-1")
      .send({
        tripId: "trip-1",
        studentId: "student-1"
      });

    expect(parentAttempt.status).toBe(403);
    expect(parentAttempt.body.code).toBe("forbidden");
  });

  it("lets admins geocode student addresses and optimize routes by school scope", async () => {
    const geocodeResponse = await request(app)
      .post("/students/student-1/address/geocode")
      .set("x-user-id", "admin-1")
      .send({
        addressText: "MG Road, Bengaluru"
      });

    expect(geocodeResponse.status).toBe(200);
    expect(mapDataMocks.geocodeStudentAddress).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "admin-1", role: "admin" }),
      studentId: "student-1",
      addressText: "MG Road, Bengaluru"
    });

    const bulkResponse = await request(app)
      .post("/schools/school-1/students/geocode-bulk")
      .set("x-user-id", "admin-1")
      .send({});

    expect(bulkResponse.status).toBe(200);
    expect(mapDataMocks.bulkGeocodeStudents).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "admin-1", role: "admin" }),
      schoolId: "school-1",
      forceRefresh: undefined
    });

    const optimizeResponse = await request(app)
      .post("/schools/school-1/routes/optimize-daily")
      .set("x-user-id", "admin-1")
      .send({});

    expect(optimizeResponse.status).toBe(200);
    expect(mapDataMocks.optimizeDailyRoutes).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "admin-1", role: "admin" }),
      schoolId: "school-1",
      dispatchAt: undefined,
      reason: undefined
    });
  });

  it("supports school map settings read and update with role restrictions", async () => {
    const parentDenied = await request(app)
      .get("/schools/school-1/map-settings")
      .set("x-user-id", "parent-1");
    expect(parentDenied.status).toBe(403);

    const getResponse = await request(app)
      .get("/schools/school-1/map-settings")
      .set("x-user-id", "admin-1");
    expect(getResponse.status).toBe(200);
    expect(mapDataMocks.getSchoolMapSettings).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "admin-1", role: "admin" }),
      schoolId: "school-1"
    });

    const updateResponse = await request(app)
      .put("/schools/school-1/map-settings")
      .set("x-user-id", "admin-1")
      .send({
        noShowWaitSeconds: 150,
        maxDetourMinutes: 20
      });
    expect(updateResponse.status).toBe(200);
    expect(mapDataMocks.upsertSchoolMapSettings).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "admin-1", role: "admin" }),
      schoolId: "school-1",
      patch: {
        noShowWaitSeconds: 150,
        maxDetourMinutes: 20
      }
    });
  });

  it("supports trip manifest, stop actions, and reoptimization endpoints with role checks", async () => {
    const manifestResponse = await request(app)
      .get("/trips/trip-1/manifest")
      .set("x-user-id", "driver-1");

    expect(manifestResponse.status).toBe(200);
    expect(mapDataMocks.getTripManifest).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "driver-1", role: "driver" }),
      tripId: "trip-1"
    });

    const arrivedResponse = await request(app)
      .post("/trips/trip-1/stops/stop-1/arrived")
      .set("x-user-id", "driver-1")
      .send({});
    expect(arrivedResponse.status).toBe(200);

    const boardedResponse = await request(app)
      .post("/trips/trip-1/stops/stop-1/boarded")
      .set("x-user-id", "driver-1")
      .send({
        notes: "Boarded safely"
      });
    expect(boardedResponse.status).toBe(200);

    const noShowResponse = await request(app)
      .post("/trips/trip-1/stops/stop-1/no-show")
      .set("x-user-id", "driver-1")
      .send({
        notes: "Not at stop"
      });
    expect(noShowResponse.status).toBe(200);
    expect(noShowResponse.body.reoptimized).toBe(true);

    const reoptimizeResponse = await request(app)
      .post("/trips/trip-1/reoptimize")
      .set("x-user-id", "admin-1")
      .send({
        reason: "manual_dispatch_override"
      });
    expect(reoptimizeResponse.status).toBe(200);
    expect(mapDataMocks.reoptimizeTrip).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "admin-1", role: "admin" }),
      tripId: "trip-1",
      reason: "manual_dispatch_override"
    });
  });

  it("supports trip incident and reassignment endpoints with role constraints", async () => {
    const majorDelayResponse = await request(app)
      .post("/trips/trip-1/incidents/major-delay")
      .set("x-user-id", "driver-1")
      .send({
        message: "Traffic delay near main junction"
      });
    expect(majorDelayResponse.status).toBe(200);

    const breakdownResponse = await request(app)
      .post("/trips/trip-1/incidents/breakdown")
      .set("x-user-id", "driver-1")
      .send({
        message: "Engine issue"
      });
    expect(breakdownResponse.status).toBe(200);

    const parentDenied = await request(app)
      .post("/trips/trip-1/reassign-driver")
      .set("x-user-id", "parent-1")
      .send({ driverId: "driver-2" });
    expect(parentDenied.status).toBe(403);

    const reassignResponse = await request(app)
      .post("/trips/trip-1/reassign-driver")
      .set("x-user-id", "admin-1")
      .send({ driverId: "driver-2" });
    expect(reassignResponse.status).toBe(200);
    expect(dataMocks.reassignTripDriver).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "admin-1", role: "admin" }),
      tripId: "trip-1",
      driverId: "driver-2"
    });
  });

  it("enforces school/super scopes for live map endpoints", async () => {
    const parentDenied = await request(app)
      .get("/maps/schools/school-1/drivers/live")
      .set("x-user-id", "parent-1");
    expect(parentDenied.status).toBe(403);

    const schoolAdminAllowed = await request(app)
      .get("/maps/schools/school-1/drivers/live")
      .set("x-user-id", "admin-1");
    expect(schoolAdminAllowed.status).toBe(200);
    expect(mapDataMocks.listLiveDrivers).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "admin-1", role: "admin" }),
      schoolId: "school-1"
    });

    const superAllowed = await request(app)
      .get("/maps/super-admin/drivers/live")
      .set("x-user-id", "super-1");
    expect(superAllowed.status).toBe(200);
    expect(mapDataMocks.listLiveDrivers).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "super-1", role: "super_admin" })
    });
  });

  it("returns parent-scoped live trip endpoint and blocks unauthorized users", async () => {
    const parentResponse = await request(app)
      .get("/parents/students/student-1/live-trip")
      .set("x-user-id", "parent-1");

    expect(parentResponse.status).toBe(200);
    expect(mapDataMocks.getParentLiveTrip).toHaveBeenCalledWith({
      actor: expect.objectContaining({ id: "parent-1", role: "parent" }),
      studentId: "student-1"
    });

    const driverDenied = await request(app)
      .get("/parents/students/student-1/live-trip")
      .set("x-user-id", "driver-1");
    expect(driverDenied.status).toBe(403);
  });

  it("issues stream token for authenticated users", async () => {
    const response = await request(app)
      .post("/auth/stream-token")
      .set("x-user-id", "admin-1")
      .send({ schoolId: "school-1" });

    expect(response.status).toBe(200);
    expect(typeof response.body.streamToken).toBe("string");
    expect(typeof response.body.expiresAt).toBe("string");
  });

  it("rejects stream endpoint without stream token and with deprecated query auth", async () => {
    const missingToken = await request(app)
      .get("/maps/events/stream");
    expect(missingToken.status).toBe(401);

    const queryAuthDenied = await request(app)
      .get("/maps/events/stream?accessToken=test-token");
    expect(queryAuthDenied.status).toBe(401);
    expect(queryAuthDenied.body.code).toBe("stream_query_auth_forbidden");
  });

  it("rejects stream token scope mismatch for school and trip filters", async () => {
    const schoolScopedToken = await request(app)
      .post("/auth/stream-token")
      .set("x-user-id", "admin-1")
      .send({ schoolId: "school-1" });
    expect(schoolScopedToken.status).toBe(200);

    const foreignSchoolResponse = await request(app)
      .get(`/maps/events/stream?streamToken=${encodeURIComponent(schoolScopedToken.body.streamToken)}&schoolId=school-2`);
    expect(foreignSchoolResponse.status).toBe(403);
    expect(foreignSchoolResponse.body.code).toBe("stream_scope_forbidden");

    const tripScopedToken = await request(app)
      .post("/auth/stream-token")
      .set("x-user-id", "admin-1")
      .send({ schoolId: "school-1", tripId: "trip-1" });
    expect(tripScopedToken.status).toBe(200);

    const foreignTripResponse = await request(app)
      .get(`/maps/events/stream?streamToken=${encodeURIComponent(tripScopedToken.body.streamToken)}&tripId=trip-2`);
    expect(foreignTripResponse.status).toBe(403);
    expect(foreignTripResponse.body.code).toBe("stream_scope_forbidden");
  });
});
