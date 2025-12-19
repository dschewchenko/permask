export type PermaskErrorCode = "UNKNOWN_GROUP" | "INVALID_GROUP_ID" | "INVALID_PACKED_STRING" | "BASE64_UNAVAILABLE";

export class PermaskError extends Error {
  readonly code: PermaskErrorCode;

  constructor(code: PermaskErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PermaskError";
    this.code = code;
  }
}
