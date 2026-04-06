import { Router, type Router as ExpressRouter, type Request } from "express";

import { asyncHandler } from "../../lib/http.js";
import { assertUserCanAccessStudent, createAdminResource, deleteAdminResource, getStudentAttendanceHistory, listAdminResources, updateAdminResource } from "../../lib/data.js";
import { geocodeStudentAddress } from "../../lib/map-data.js";
import { adminResourceSchema, geocodeStudentSchema } from "../../lib/validation.js";
import { requireRole } from "../../middleware/require-role.js";
import { requireUser } from "../../middleware/require-user.js";

export const studentsRouter: ExpressRouter = Router();

studentsRouter.use(requireUser);

function resolveSchoolScope(request: Request) {
  const user = request.currentUser!;
  if (user.role === "super_admin") {
    const requestedSchoolId = request.query.schoolId;
    return typeof requestedSchoolId === "string" ? requestedSchoolId : undefined;
  }

  return user.schoolId;
}

studentsRouter.get("/", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  response.json({
    items: await listAdminResources("students", resolveSchoolScope(request))
  });
}));

studentsRouter.post("/", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  const payload = adminResourceSchema.parse(request.body);
  response.status(201).json(await createAdminResource("students", resolveSchoolScope(request), payload));
}));

studentsRouter.post("/:studentId/address/geocode", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  const body = geocodeStudentSchema.parse(request.body ?? {});
  const result = await geocodeStudentAddress({
    actor: request.currentUser!,
    studentId: String(request.params.studentId),
    addressText: body.addressText
  });

  response.json(result);
}));

studentsRouter.get("/:studentId/attendance", asyncHandler(async (request, response) => {
  const user = request.currentUser!;
  const studentId = String(request.params.studentId);
  await assertUserCanAccessStudent(user, studentId);
  const history = await getStudentAttendanceHistory(
    studentId,
    user.role === "parent" || user.role === "super_admin" ? undefined : user.schoolId
  );

  response.json({
    studentId,
    attendance: history
  });
}));

studentsRouter.get("/:studentId/history", asyncHandler(async (request, response) => {
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

studentsRouter.put("/:studentId", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  const payload = adminResourceSchema.parse(request.body);
  response.json(await updateAdminResource("students", String(request.params.studentId), resolveSchoolScope(request), payload));
}));

studentsRouter.delete("/:studentId", requireRole("admin", "super_admin"), asyncHandler(async (request, response) => {
  await deleteAdminResource("students", String(request.params.studentId), resolveSchoolScope(request));
  response.status(204).send();
}));
