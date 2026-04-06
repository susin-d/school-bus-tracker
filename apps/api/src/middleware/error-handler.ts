import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";

import { HttpError } from "../lib/http.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  if (error instanceof ZodError) {
    response.status(400).json({
      error: "Invalid request payload",
      code: "validation_error",
      details: error.issues
    });
    return;
  }

  if (error instanceof HttpError) {
    response.status(error.status).json({
      error: error.message,
      code: error.code
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    error: error instanceof Error ? error.message : "Internal server error",
    code: "internal_server_error"
  });
};
