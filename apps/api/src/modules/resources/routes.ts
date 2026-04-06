import { Router, type Router as ExpressRouter, type Request } from "express";

import { createAdminResource, deleteAdminResource, listAdminResources, updateAdminResource, type AdminResource } from "../../lib/data.js";
import { asyncHandler } from "../../lib/http.js";
import { adminResourceSchema } from "../../lib/validation.js";
import { requireRole } from "../../middleware/require-role.js";
import { requireUser } from "../../middleware/require-user.js";

export function createResourceRouter(resource: AdminResource): ExpressRouter {
  const router: ExpressRouter = Router();

  function resolveSchoolScope(request: Request) {
    const user = request.currentUser!;
    if (user.role === "super_admin") {
      const requestedSchoolId = request.query.schoolId;
      return typeof requestedSchoolId === "string" ? requestedSchoolId : undefined;
    }

    return user.schoolId;
  }

  router.use(requireUser);
  router.use(requireRole("admin", "super_admin"));

  router.get("/", asyncHandler(async (request, response) => {
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

  router.post("/", asyncHandler(async (request, response) => {
    const payload = adminResourceSchema.parse(request.body);
    response.status(201).json(await createAdminResource(resource, resolveSchoolScope(request), payload));
  }));

  router.put("/:resourceId", asyncHandler(async (request, response) => {
    const payload = adminResourceSchema.parse(request.body);
    response.json(await updateAdminResource(resource, String(request.params.resourceId), resolveSchoolScope(request), payload));
  }));

  router.delete("/:resourceId", asyncHandler(async (request, response) => {
    await deleteAdminResource(resource, String(request.params.resourceId), resolveSchoolScope(request));
    response.status(204).send();
  }));

  return router;
}
