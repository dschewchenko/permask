import type { PreHandler } from "elysia";
import { hasRequiredPermission } from "../../utils/bitmask";
import { defaultPermaskElysiaOptions, type PermaskElysiaOptions } from "./options";

export type { PermaskElysiaOptions } from "./options";
export { defaultPermaskElysiaOptions } from "./options";

export type ElysiaBeforeHandleLike = PreHandler;

/**
 * Create Elysia `beforeHandle` factory for Permask.
 *
 * Use it in route options or inside `.guard(...)`.
 *
 * Default behavior reads permissions from `ctx.store.user.permissions` (configurable via `options.permissionsKey`).
 *
 * @example
 * ```ts
 * import { Elysia } from "elysia";
 * import { PermissionAccess } from "permask";
 * import { permaskElysia } from "permask/elysia";
 *
 * const groups = { admin: 1 } as const;
 *
 * // Authentication hook/plugin must populate `ctx.store.user.permissions` (number[] bitmasks).
 * const checkPermission = permaskElysia(groups, {
 *   getPermissions: (_opts, ctx) => (ctx.store as any).user?.permissions ?? []
 * });
 *
 * new Elysia()
 *   .get("/protected", () => "ok", {
 *     beforeHandle: checkPermission(groups.admin, PermissionAccess.READ)
 *   })
 *   .listen(3000);
 * ```
 */
export type PermaskElysiaBeforeHandleFactory<Groups extends Record<string, number | string>> = (
  group: Groups[keyof Groups],
  accessMask: number
) => ElysiaBeforeHandleLike;

export function permaskElysia<Groups extends Record<string, number | string>>(
  _groups: Groups,
  opts?: PermaskElysiaOptions
): PermaskElysiaBeforeHandleFactory<Groups> {
  const options = { ...defaultPermaskElysiaOptions, ...opts };

  return function checkPermissions(group: Groups[keyof Groups], accessMask: number): ElysiaBeforeHandleLike {
    return async (ctx) => {
      try {
        const bitmasks = await options.getPermissions(options, ctx);

        if (hasRequiredPermission(bitmasks, group as number, accessMask)) {
          return;
        }

        return options.forbiddenResponse(ctx);
      } catch (_error) {
        return ctx.status(500);
      }
    };
  };
}
