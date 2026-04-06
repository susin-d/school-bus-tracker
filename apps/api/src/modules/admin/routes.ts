import { Router, type Router as ExpressRouter, type Request } from "express";

import { createAdminResource, deleteAdminResource, getDashboardSummary, listAdminResources, listNightlyPlannerRuns, updateAdminResource, type AdminResource } from "../../lib/data.js";
import { sendAdminBroadcastEmail } from "../../lib/admin-mail.js";
import { asyncHandler, HttpError } from "../../lib/http.js";
import { adminBroadcastEmailSchema, adminResourceSchema } from "../../lib/validation.js";
import { requireRole } from "../../middleware/require-role.js";
import { requireUser } from "../../middleware/require-user.js";

export const adminRouter: ExpressRouter = Router();

const adminResources = ["schools", "users", "routes", "stops", "buses", "drivers", "students", "assignments"] as const;

function resolveSchoolScope(request: Request) {
  const user = request.currentUser!;
  if (user.role === "super_admin") {
    const requestedSchoolId = request.query.schoolId;
    return typeof requestedSchoolId === "string" ? requestedSchoolId : undefined;
  }

  return user.schoolId;
}

function assertAdminResource(value: string): AdminResource {
  if ((adminResources as readonly string[]).includes(value)) {
    return value as AdminResource;
  }

  throw new HttpError(404, "Unknown admin resource", "unknown_admin_resource");
}

adminRouter.use(requireUser);
adminRouter.use(requireRole("admin", "super_admin"));

adminRouter.get("/dashboard", asyncHandler(async (request, response) => {
  response.json(await getDashboardSummary(resolveSchoolScope(request)));
}));

adminRouter.get("/planner-runs", asyncHandler(async (request, response) => {
  const limit = typeof request.query.limit === "string" ? Number(request.query.limit) : undefined;
  response.json({
    runs: await listNightlyPlannerRuns({
      schoolId: resolveSchoolScope(request),
      limit
    })
  });
}));

adminRouter.post("/mail/send", asyncHandler(async (request, response) => {
  const body = adminBroadcastEmailSchema.parse(request.body ?? {});
  const result = await sendAdminBroadcastEmail({
    actor: request.currentUser!,
    mode: body.mode,
    schoolId: body.schoolId,
    studentIds: body.studentIds,
    emails: body.emails,
    userIds: body.userIds,
    subject: body.subject,
    message: body.message
  });

  response.json(result);
}));

adminRouter.get("/:resource", asyncHandler(async (request, response) => {
  const resource = assertAdminResource(String(request.params.resource));
  const filters: Record<string, string> = {};
  if (resource === "users") {
    if (typeof request.query.role === "string") {
      filters.role = request.query.role;
    }
    if (typeof request.query.status === "string") {
      filters.status = request.query.status;
    }
  }
  response.json({
    items: await listAdminResources(resource, resolveSchoolScope(request), filters)
  });
}));

adminRouter.post("/:resource", asyncHandler(async (request, response) => {
  const resource = assertAdminResource(String(request.params.resource));
  const payload = adminResourceSchema.parse(request.body);
  response.status(201).json(await createAdminResource(resource, resolveSchoolScope(request), payload));
}));

adminRouter.put("/:resource/:resourceId", asyncHandler(async (request, response) => {
  const resource = assertAdminResource(String(request.params.resource));
  const payload = adminResourceSchema.parse(request.body);
  response.json(await updateAdminResource(resource, String(request.params.resourceId), resolveSchoolScope(request), payload));
}));

adminRouter.delete("/:resource/:resourceId", asyncHandler(async (request, response) => {
  const resource = assertAdminResource(String(request.params.resource));
  await deleteAdminResource(resource, String(request.params.resourceId), resolveSchoolScope(request));
  response.status(204).send();
}));
