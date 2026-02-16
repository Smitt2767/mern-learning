import { ERROR_CODE, type ErrorCode } from "@mern/core";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: ErrorCode;

  constructor(
    message: string,
    statusCode: number,
    code: ErrorCode,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = "Bad Request") {
    return new AppError(message, 400, ERROR_CODE.BAD_REQUEST);
  }

  static unauthorized(
    message = "Unauthorized",
    code: ErrorCode = ERROR_CODE.UNAUTHORIZED,
  ) {
    return new AppError(message, 401, code);
  }

  static tokenExpired(message = "Token has expired") {
    return new AppError(message, 401, ERROR_CODE.TOKEN_EXPIRED);
  }

  static invalidToken(message = "Invalid token") {
    return new AppError(message, 401, ERROR_CODE.INVALID_TOKEN);
  }

  static sessionExpired(message = "Session expired") {
    return new AppError(message, 401, ERROR_CODE.SESSION_EXPIRED);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(message, 403, ERROR_CODE.FORBIDDEN);
  }

  static notFound(message = "Not Found") {
    return new AppError(message, 404, ERROR_CODE.NOT_FOUND);
  }

  static conflict(message = "Conflict") {
    return new AppError(message, 409, ERROR_CODE.CONFLICT);
  }

  static tooMany(message = "Too Many Requests") {
    return new AppError(message, 429, ERROR_CODE.TOO_MANY_REQUESTS);
  }

  static internal(message = "Internal Server Error") {
    return new AppError(message, 500, ERROR_CODE.INTERNAL_ERROR, false);
  }
}
