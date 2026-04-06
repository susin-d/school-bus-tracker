import type { NextFunction, Request, Response } from "express";

import { getUserProfileByAuthUserId, getUserProfileById } from "../lib/data.js";
import { getSupabaseUser } from "../lib/supabase.js";

function getBearerToken(request: Request) {
  const authorization = request.header("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

export async function requireUser(request: Request, response: Response, next: NextFunction) {
  const token = getBearerToken(request);
  const headerUserId = request.header("x-user-id");
  const isTestEnv = process.env.NODE_ENV === "test";

  if (token) {
    try {
      const authUser = await getSupabaseUser(token);
      const user = await getUserProfileByAuthUserId(authUser.id);

      if (!user) {
        response.status(401).json({
          error: "User profile not found for Supabase account",
          code: "user_profile_not_found"
        });
        return;
      }

      request.currentUser = user;
      next();
      return;
    } catch (error) {
      response.status(401).json({
        error: error instanceof Error ? error.message : "Invalid bearer token",
        code: "invalid_bearer_token"
      });
      return;
    }
  }

  if (!isTestEnv) {
    response.status(401).json({
      error: "Missing bearer token",
      code: "missing_authentication"
    });
    return;
  }

  if (!headerUserId) {
    response.status(401).json({
      error: "Missing bearer token or x-user-id header",
      code: "missing_authentication"
    });
    return;
  }

  const user = await getUserProfileById(headerUserId);

  if (!user) {
    response.status(401).json({
      error: "User not found",
      code: "user_not_found"
    });
    return;
  }

  request.currentUser = user;
  next();
}
