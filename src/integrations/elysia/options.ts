import type { PreContext } from "elysia";
import { get } from "../../utils/object";

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
   * @default ({ permissionsKey }, ctx) => get(ctx, permissionsKey, [])
   */
  getPermissions?: (opts: Required<PermaskElysiaOptions>, ctx: PreContext) => number[] | Promise<number[]>;

  /**
   * Callback to return a forbidden response from `beforeHandle`.
   *
   * @default ({ status }) => status?.(403)
   */
  forbiddenResponse?: (ctx: PreContext) => unknown;
};

/**
 * Default options for `permaskElysia(...)`.
 */
export const defaultPermaskElysiaOptions: Required<PermaskElysiaOptions> = {
  permissionsKey: "store.user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskElysiaOptions>, ctx: PreContext) =>
    get(ctx as unknown as Record<string, unknown>, permissionsKey, []) as number[],
  forbiddenResponse: ({ status }: PreContext) => status(403)
};
