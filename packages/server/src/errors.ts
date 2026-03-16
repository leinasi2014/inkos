export class InkOSError extends Error {
  readonly code: string;
  readonly details?: unknown;
  readonly statusCode?: number;

  constructor(code: string, message: string, options?: { details?: unknown; statusCode?: number }) {
    super(message);
    this.code = code;
    this.details = options?.details;
    this.statusCode = options?.statusCode;
  }
}

export function errorPayload(error: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof InkOSError) {
    return {
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    };
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL.UNEXPECTED",
      message: error.message,
    };
  }

  return {
    code: "INTERNAL.UNKNOWN",
    message: "Unknown error",
  };
}

export function httpStatus(error: unknown): number {
  if (error instanceof InkOSError && error.statusCode) {
    return error.statusCode;
  }

  return 500;
}
