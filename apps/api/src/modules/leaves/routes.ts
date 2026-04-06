import { Router, type Router as ExpressRouter } from "express";

import type { LeaveRequestInput, LeaveRequestListResponse } from "@school-bus/shared";

import { assertUserCanAccessStudent, createLeaveRequest, listLeaveRequests, updateLeaveRequestStatus } from "../../lib/data.js";
import { asyncHandler } from "../../lib/http.js";
import { leaveRequestSchema, leaveRequestStatusSchema } from "../../lib/validation.js";
import { requireRole } from "../../middleware/require-role.js";
import { requireUser } from "../../middleware/require-user.js";

export const leavesRouter: ExpressRouter = Router();

leavesRouter.use(requireUser);

leavesRouter.get("/", asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const payload: LeaveRequestListResponse = {
    requests: await listLeaveRequests(user)
  };

  response.json(payload);
}));

leavesRouter.post("/", requireRole("parent"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const body = leaveRequestSchema.parse(request.body as Partial<LeaveRequestInput>);
  await assertUserCanAccessStudent(user, body.studentId);

  const leaveRequest = await createLeaveRequest({
    studentId: body.studentId,
    requestedByParentId: user.id,
    leaveDate: body.leaveDate,
    tripKind: body.tripKind,
    reason: body.reason
  });

  response.status(201).json(leaveRequest);
}));

leavesRouter.post("/:leaveRequestId/status", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const leaveRequestId = String(request.params.leaveRequestId);
  const body = leaveRequestStatusSchema.parse(request.body as { status?: "approved" | "rejected" });

  const updated = await updateLeaveRequestStatus({
    actor: user,
    leaveRequestId,
    status: body.status
  });

  response.json(updated);
}));
