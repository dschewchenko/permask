import type Koa from "koa";
import { hasRequiredPermission } from "../../utils/bitmask";
import { defaultPermaskKoaOptions, type PermaskKoaOptions } from "./options";

export type { PermaskKoaOptions } from "./options";
export { defaultPermaskKoaOptions } from "./options";

/**
 * Minimal Koa middleware signature.
 */
export type KoaMiddlewareLike = Koa.Middleware;

/**
 * Middleware factory returned by {@link permaskKoa}.
 */
export type PermaskKoaMiddlewareFactory<Groups extends Record<string, number | string>> = (
  group: Groups[keyof Groups],
  accessMask: number
) => KoaMiddlewareLike;

/**
 * Create Koa middleware factory for Permask.
 *
 * Default behavior reads permissions from `ctx.state.user.permissions` (configurable via `options.permissionsKey`).
 *
 * @example
 * ```ts
 * import Koa from "koa";
 * import { PermissionAccess } from "permask";
 * import { permaskKoa } from "permask/koa";
 *
 * const groups = { admin: 1 } as const;
 * const app = new Koa();
 *
 * // Authentication middleware must populate `ctx.state.user.permissions` (number[] bitmasks).
 * app.use(async (ctx, next) => {
 *   const user = await authenticateRequest(ctx); // your code
 *   if (!user) {
 *     ctx.status = 401;
 *     ctx.body = { error: "Unauthorized" };
 *     return;
 *   }
 *
 *   (ctx.state as any).user = { permissions: user.permissionsBitmasks };
 *   await next();
 * });
 *
 * const checkPermission = permaskKoa(groups, {
 *   getPermissions: (_opts, ctx) => (ctx.state as any).user?.permissions ?? []
 * });
 *
 * app.use(checkPermission(groups.admin, PermissionAccess.READ));
 * app.use(async (ctx) => {
 *   ctx.body = "ok";
 * });
 * ```
 */
export function permaskKoa<Groups extends Record<string, number | string>>(
  _groups: Groups,
  opts?: PermaskKoaOptions
): PermaskKoaMiddlewareFactory<Groups> {
  const options = { ...defaultPermaskKoaOptions, ...opts };

  return function checkPermissions(group: Groups[keyof Groups], accessMask: number): Koa.Middleware {
    return async (ctx, next) => {
      try {
        const bitmasks = await options.getPermissions(options, ctx);

        if (hasRequiredPermission(bitmasks, group as number, accessMask)) {
          return next();
        }

        return options.forbiddenResponse(ctx);
      } catch (error) {
        ctx.status = 500;
        ctx.body = {
          error: "Internal server error",
          // @ts-expect-error
          details: error?.message
        };
      }
    };
  };
}
