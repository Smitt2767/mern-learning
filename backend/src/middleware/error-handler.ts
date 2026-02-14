import { Logger } from "@mern/logger";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (res.headersSent) {
    return _next(err);
  }

  let statusCode = 500;
  let message = "Internal Server Error";
  let isOperational = false;
  let errors: { field: string; message: string }[] | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    isOperational = true;
    errors = err.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    }));
  } else if (
    err instanceof SyntaxError &&
    "body" in err &&
    "type" in err &&
    (err as Record<string, unknown>).type === "entity.parse.failed"
  ) {
    statusCode = 400;
    message = "Invalid JSON in request body";
    isOperational = true;
  }

  if (isOperational) {
    Logger.warn(`${statusCode} ${req.method} ${req.originalUrl} - ${message}`);
  } else {
    Logger.error(`${statusCode} ${req.method} ${req.originalUrl}`, err);
  }

  const response: Record<string, unknown> = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  if (env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
