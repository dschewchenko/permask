import type Koa from "koa";
import { get } from "../../utils/object";

/**
 * Options for `permaskKoa(...)`.
 */
export type PermaskKoaOptions = {
  /**
   * Context property, where to get permissions.
   *
   * @default "state.user.permissions"
   */
  permissionsKey?: string;

  /**
   * Callback to get permissions from ctx.
   *
   * @default ({ permissionsKey }, ctx) => get(ctx, permissionsKey, [])
   */
  getPermissions?: (opts: Required<PermaskKoaOptions>, ctx: Koa.Context) => number[] | Promise<number[]>;

  /**
   * Callback to set forbidden response on ctx.
   *
   * @default (ctx) => { ctx.status = 403; ctx.body = { error: "Access denied" } }
   */
  forbiddenResponse?: (ctx: Koa.Context) => unknown | Promise<unknown>;
};

/**
 * Default options for `permaskKoa(...)`.
 */
export const defaultPermaskKoaOptions: Required<PermaskKoaOptions> = {
  permissionsKey: "state.user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskKoaOptions>, ctx: Koa.Context) =>
    get(ctx as unknown as Record<string, unknown>, permissionsKey, []) as number[],
  forbiddenResponse: (ctx: Koa.Context) => {
    ctx.status = 403;
    ctx.body = { error: "Access denied" };
  }
};
