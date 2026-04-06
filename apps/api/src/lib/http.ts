import type { RequestHandler } from "express";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
