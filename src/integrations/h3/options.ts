import type { createError, H3Event } from "h3";
import { readPermissionBitmasks } from "../../utils/object";

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
   * @default ({ permissionsKey }, event) => readPermissionBitmasks(event, permissionsKey)
   */
  getPermissions?: (opts: Required<PermaskH3Options>, event: H3Event) => Array<number> | Promise<Array<number>>;

  /**
   * Factory for a "forbidden" error (should be compatible with H3 error handling).
   *
   * @default () => Object.assign(new Error("Access denied"), { status: 403, statusText: "Forbidden" })
   */
  forbiddenError?: (event: H3Event) => Parameters<typeof createError>[0];
};

/**
 * Default options for `permaskH3(...)`.
 */
export const defaultPermaskH3Options = {
  permissionsKey: "context.user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskH3Options>, event: H3Event) =>
    readPermissionBitmasks(event, permissionsKey),
  forbiddenError: () => Object.assign(new Error("Access denied"), { status: 403, statusText: "Forbidden" })
} satisfies Required<PermaskH3Options>;
