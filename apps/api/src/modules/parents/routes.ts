import { Router, type Router as ExpressRouter } from "express";

import type { ParentLiveTripResponse } from "@school-bus/shared";

import { asyncHandler } from "../../lib/http.js";
import { getParentLiveTrip } from "../../lib/map-data.js";
import { requireRole } from "../../middleware/require-role.js";
import { requireUser } from "../../middleware/require-user.js";

export const parentsRouter: ExpressRouter = Router();

parentsRouter.use(requireUser);
parentsRouter.use(requireRole("parent", "admin", "super_admin"));

parentsRouter.get("/students/:studentId/live-trip", asyncHandler(async (request, response) => {
  const liveTrip = await getParentLiveTrip({
    actor: request.currentUser!,
    studentId: String(request.params.studentId)
  });

  const payload: ParentLiveTripResponse = {
    liveTrip
  };
  response.json(payload);
}));

