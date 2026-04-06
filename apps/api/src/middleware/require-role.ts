import type { NextFunction, Request, Response } from "express";
import type { Role } from "@school-bus/shared";

export function requireRole(...roles: Role[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const user = request.currentUser;

    if (!user) {
      response.status(401).json({
        error: "Authentication required",
        code: "authentication_required"
      });
      return;
    }

    if (!roles.includes(user.role)) {
      response.status(403).json({
        error: "You do not have permission to access this resource",
        code: "forbidden"
      });
      return;
    }

    next();
  };
}
