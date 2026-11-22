import type { PreContext, PreHandler } from "elysia";
import { readPermissionBitmasks } from "../../utils/object";

/**
 * Options for `permaskElysia(...)`.
 */
export type PermaskElysiaOptions = {
  /**
   * Context property, where to get permissions.
   *
   * @default "store.user.permissions"
   */
  permissionsKey?: string;

  /**
   * Callback to get permissions from context.
   *
   * @default ({ permissionsKey }, ctx) => readPermissionBitmasks(ctx, permissionsKey)
   */
  getPermissions?: (opts: Required<PermaskElysiaOptions>, ctx: PreContext) => Array<number> | Promise<Array<number>>;

  /**
   * Callback to return a forbidden response from `beforeHandle`.
   *
   * @default ({ status }) => status?.(403)
   */
  forbiddenResponse?: (ctx: PreContext) => ReturnType<PreHandler>;
};

/**
 * Default options for `permaskElysia(...)`.
 */
export const defaultPermaskElysiaOptions = {
  permissionsKey: "store.user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskElysiaOptions>, ctx: PreContext) =>
    readPermissionBitmasks(ctx, permissionsKey),
  forbiddenResponse: ({ status }: PreContext) => status(403)
} satisfies Required<PermaskElysiaOptions>;
