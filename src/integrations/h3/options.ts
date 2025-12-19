import type { H3Event } from "h3";
import { get } from "../../utils/object";

/**
 * Options for `permaskH3(...)`.
 */
export type PermaskH3Options = {
  /**
   * Event property, where to get permissions.
   *
   * @default "context.user.permissions"
   */
  permissionsKey?: string;

  /**
   * Callback to get permissions from event.
   *
   * @default ({ permissionsKey }, event) => get(event, permissionsKey, [])
   */
  getPermissions?: (opts: Required<PermaskH3Options>, event: H3Event) => number[] | Promise<number[]>;

  /**
   * Factory for a "forbidden" error (should be compatible with H3 error handling).
   *
   * @default () => Object.assign(new Error("Access denied"), { status: 403, statusText: "Forbidden" })
   */
  forbiddenError?: (event: H3Event) => unknown;
};

/**
 * Default options for `permaskH3(...)`.
 */
export const defaultPermaskH3Options: Required<PermaskH3Options> = {
  permissionsKey: "context.user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskH3Options>, event: H3Event) =>
    get(event as unknown as Record<string, unknown>, permissionsKey, []) as number[],
  forbiddenError: () => Object.assign(new Error("Access denied"), { status: 403, statusText: "Forbidden" })
};
