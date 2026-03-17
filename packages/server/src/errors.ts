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

const PUBLIC_ERROR_CODES = new Set([
  "BOOK.CONFLICT",
  "BOOK.INVALID_INPUT",
  "COMMAND.BOOK_CONTEXT_REQUIRED",
  "COMMAND.INVALID_PAYLOAD",
  "COMMAND.THREAD_MISMATCH",
  "COMMAND.UNSUPPORTED",
  "DRAFT.CONFLICT",
  "DRAFT.NOT_FOUND",
  "REQUEST.INVALID",
  "RUN.NOT_FOUND",
  "WS.AUTH_REQUIRED",
  "WS.ORIGIN_FORBIDDEN",
]);

const GENERIC_PUBLIC_MESSAGE = "服务内部处理失败，请稍后重试。";

export function errorPayload(error: unknown): {
  code: string;
  message: string;
  details?: unknown;
} {
  if (error instanceof InkOSError) {
    const isPublicError = PUBLIC_ERROR_CODES.has(error.code);
    return {
      code: error.code,
      message: isPublicError ? error.message : GENERIC_PUBLIC_MESSAGE,
      ...(isPublicError && error.details !== undefined ? { details: error.details } : {}),
    };
  }

  if (error instanceof Error) {
    return {
      code: "INTERNAL.UNEXPECTED",
      message: GENERIC_PUBLIC_MESSAGE,
    };
  }

  return {
    code: "INTERNAL.UNKNOWN",
    message: GENERIC_PUBLIC_MESSAGE,
  };
}

export function httpStatus(error: unknown): number {
  if (error instanceof InkOSError && error.statusCode) {
    return error.statusCode;
  }

  return 500;
}
