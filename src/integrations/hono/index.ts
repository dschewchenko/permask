import type { Env, Input, MiddlewareHandler } from "hono";
import { hasRequiredPermission } from "../../utils/bitmask";
import { defaultPermaskHonoOptions, type PermaskHonoOptions } from "./options";

export type { PermaskHonoOptions } from "./options";
export { defaultPermaskHonoOptions } from "./options";

/**
 * Middleware factory returned by {@link permaskHono}.
 */
export type PermaskHonoMiddlewareFactory<
  Groups extends Record<string, number | string>,
  E extends Env = Env,
  P extends string = string,
  I extends Input = Input
> = (group: Groups[keyof Groups], accessMask: number) => MiddlewareHandler<E, P, I>;

/**
 * Create Hono middleware factory for Permask.
 *
 * Default behavior reads permissions from `c.get("permissions")` (configurable via `options.permissionsVariable`).
 *
 * @example
 * ```ts
 * import { Hono } from "hono";
 * import { PermissionAccess } from "permask";
 * import { permaskHono } from "permask/hono";
 *
 * const groups = { admin: 1 } as const;
 * const app = new Hono();
 *
 * // Authentication middleware (JWT/session):
 * app.use("*", async (c, next) => {
 *   const user = await authenticateRequest(c); // your code
 *   if (!user) return c.json({ error: "Unauthorized" }, 401);
 *
 *   // Attach permission bitmasks for permask to read.
 *   c.set("permissions", user.permissionsBitmasks); // number[] bitmasks
 *   await next();
 * });
 *
 * const checkPermission = permaskHono(groups);
 *
 * app.get("/protected", checkPermission(groups.admin, PermissionAccess.READ), (c) => c.text("ok"));
 * ```
 */
export function permaskHono<
  Groups extends Record<string, number | string>,
  E extends Env = Env,
  P extends string = string,
  I extends Input = Input
>(_groups: Groups, opts?: PermaskHonoOptions<E, P, I>): PermaskHonoMiddlewareFactory<Groups, E, P, I> {
  const options = { ...defaultPermaskHonoOptions, ...opts } as Required<PermaskHonoOptions<E, P, I>>;

  return function checkPermissions(group: Groups[keyof Groups], accessMask: number): MiddlewareHandler<E, P, I> {
    return async (c, next) => {
      try {
        const bitmasks = await options.getPermissions(options, c);

        if (hasRequiredPermission(bitmasks, group as number, accessMask)) {
          return next();
        }

        return options.forbiddenResponse(c);
      } catch (error) {
        return c.json(
          {
            error: "Internal server error",
            // @ts-expect-error
            details: error?.message
          },
          500
        );
      }
    };
  };
}
