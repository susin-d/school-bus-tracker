import { z } from "zod";

export const idTokenSchema = z.object({
  accessToken: z.string().min(1).optional(),
  idToken: z.string().min(1).optional()
}).refine((value) => value.accessToken || value.idToken, {
  message: "accessToken is required"
});

export const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const streamTokenRequestSchema = z.object({
  schoolId: z.string().min(1).optional(),
  tripId: z.string().min(1).optional()
});

export const otpSendSchema = z.object({
  phone: z.string().min(6)
});

export const otpVerifySchema = z.object({
  phone: z.string().min(6),
  otp: z.string().min(4)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  redirectTo: z.string().url().optional()
});

export const parentForgotPasswordOtpSendSchema = z.object({
  email: z.string().email()
});

export const parentForgotPasswordOtpVerifySchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "otp must be a 6 digit code"),
  newPassword: z.string().min(8).max(128)
});

export const emailVerificationSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  redirectTo: z.string().url().optional()
});

export const tripStatusSchema = z.object({
  status: z.enum(["ready", "active", "paused", "completed", "cancelled"])
});

export const tripLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  speedKph: z.number().optional(),
  heading: z.number().optional(),
  recordedAt: z.string().datetime().optional()
});

export const attendanceEventSchema = z.object({
  studentId: z.string().min(1),
  eventType: z.enum(["boarded", "dropped", "absent", "manual_override"]),
  stopId: z.string().optional(),
  notes: z.string().max(500).optional()
});

export const alertCreateSchema = z.object({
  tripId: z.string().optional(),
  type: z.enum([
    "sos",
    "delay",
    "geofence",
    "route_deviation",
    "speed_anomaly",
    "attendance_anomaly"
  ]),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  message: z.string().min(1).max(1000)
});

export const leaveRequestSchema = z.object({
  studentId: z.string().min(1),
  leaveDate: z.string().datetime(),
  tripKind: z.enum(["pickup", "dropoff", "both"]),
  reason: z.string().max(500).optional()
});

export const leaveRequestStatusSchema = z.object({
  status: z.enum(["approved", "rejected"])
});

export const alertResolutionSchema = z.object({
  resolutionNote: z.string().max(1000).optional()
});

export const adminResourceSchema = z.object({
  name: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  status: z.string().optional()
}).catchall(z.unknown());

export const geocodeStudentSchema = z.object({
  addressText: z.string().min(5).optional()
});

export const bulkGeocodeSchema = z.object({
  forceRefresh: z.boolean().optional()
});

export const optimizeDailyRoutesSchema = z.object({
  dispatchAt: z.string().datetime().optional(),
  reason: z.string().max(200).optional()
});

export const reoptimizeTripSchema = z.object({
  reason: z.string().max(200).optional()
});

export const stopBoardedSchema = z.object({
  notes: z.string().max(500).optional()
});

export const mapSettingsUpdateSchema = z.object({
  dispatchStartTime: z.string().datetime().optional(),
  noShowWaitSeconds: z.number().int().min(30).max(900).optional(),
  maxDetourMinutes: z.number().int().min(1).max(120).optional(),
  dispatchLatitude: z.number().min(-90).max(90).optional(),
  dispatchLongitude: z.number().min(-180).max(180).optional()
});

export const adminBroadcastEmailSchema = z.object({
  mode: z.enum(["all_students", "selected_students", "emails", "users"]),
  schoolId: z.string().min(1).optional(),
  studentIds: z.array(z.string().min(1)).optional(),
  emails: z.array(z.string().email()).optional(),
  userIds: z.array(z.string().min(1)).optional(),
  subject: z.string().min(3).max(150),
  message: z.string().min(3).max(5000)
}).superRefine((value, context) => {
  if (value.mode === "selected_students" && (!value.studentIds || value.studentIds.length === 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "studentIds are required for selected_students mode",
      path: ["studentIds"]
    });
  }

  if (value.mode === "emails" && (!value.emails || value.emails.length === 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "emails are required for emails mode",
      path: ["emails"]
    });
  }

  if (value.mode === "users" && (!value.userIds || value.userIds.length === 0)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "userIds are required for users mode",
      path: ["userIds"]
    });
  }
});

export const tripIncidentSchema = z.object({
  message: z.string().min(3).max(1000).optional(),
  reason: z.string().max(200).optional()
});

export const reassignDriverSchema = z.object({
  driverId: z.string().min(1)
});
