import type { H3Event } from "h3";
import { hasRequiredPermission } from "../../utils/bitmask";
import { defaultPermaskH3Options, type PermaskH3Options } from "./options";

export type { PermaskH3Options } from "./options";
export { defaultPermaskH3Options } from "./options";

/**
 * H3 middleware-like function that can be used in two ways:
 * - As an `onRequest` handler in `defineEventHandler({ onRequest, handler })` (called with just `event`)
 * - As a small composition helper `(event, next)` when you want to wrap another handler manually
 */
export type H3MiddlewareLike = (event: H3Event, next?: () => unknown | Promise<unknown>) => unknown | Promise<unknown>;

/**
 * H3 helpers returned by {@link permaskH3}.
 */
export type PermaskH3Integration<Groups extends Record<string, number | string>> = {
  /**
   * Assert that the request has the required permission.
   *
   * Reads permission bitmasks via `options.getPermissions(...)` and throws `options.forbiddenError(event)`
   * when the permission is missing.
   *
   * @example
   * ```ts
   * import { defineEventHandler } from "h3";
   * import { PermissionAccess } from "permask";
   * import { permaskH3 } from "permask/h3";
   *
   * const groups = { admin: 1 } as const;
   * const { requirePermask } = permaskH3(groups);
   *
   * export default defineEventHandler(async (event) => {
   *   // Auth middleware should have populated `event.context.user.permissions` (number[] bitmasks).
   *   await requirePermask(event, groups.admin, PermissionAccess.READ);
   *   return "ok";
   * });
   * ```
   */
  requirePermask: (event: H3Event, group: Groups[keyof Groups], accessMask: number) => Promise<true>;

  /**
   * Create a middleware wrapper around {@link PermaskH3Integration.requirePermask}.
   *
   * Most idiomatic usage is as an `onRequest` middleware in H3:
   *
   * @example
   * ```ts
   * export default defineEventHandler({
   *   onRequest: [
   *     async (event) => {
   *       const user = await authenticateRequest(event); // your code
   *       if (!user) throw Object.assign(new Error("Unauthorized"), { status: 401 });
   *
   *       (event.context as any).user = { permissions: user.permissionsBitmasks };
   *     },
   *     permaskMiddleware(groups.admin, PermissionAccess.READ)
   *   ],
   *   handler: () => "ok"
   * });
   * ```
   *
   * You can also use it as a composition helper with a `next()` callback:
   *
   * @example
   * ```ts
   * export default defineEventHandler((event) =>
   *   permaskMiddleware(groups.admin, PermissionAccess.READ)(event, () => "ok")
   * );
   * ```
   */
  permaskMiddleware: (group: Groups[keyof Groups], accessMask: number) => H3MiddlewareLike;
};

/**
 * Create H3 helpers for Permask.
 *
 * Returns:
 * - `requirePermask(event, group, accessMask)` — throws on forbidden
 * - `permaskMiddleware(group, accessMask)` — request middleware / composition helper
 *
 * @example
 * ```ts
 * import { defineEventHandler } from "h3";
 * import { PermissionAccess } from "permask";
 * import { permaskH3 } from "permask/h3";
 *
 * const groups = { admin: 1 } as const;
 * const { requirePermask } = permaskH3(groups);
 *
 * export default defineEventHandler(async (event) => {
 *   // Auth middleware should have populated `event.context.user.permissions` (number[] bitmasks).
 *   await requirePermask(event, groups.admin, PermissionAccess.READ);
 *   return "ok";
 * });
 * ```
 */
export function permaskH3<Groups extends Record<string, number | string>>(
  _groups: Groups,
  opts?: PermaskH3Options
): PermaskH3Integration<Groups> {
  const options = { ...defaultPermaskH3Options, ...opts };

  async function requirePermask(event: H3Event, group: Groups[keyof Groups], accessMask: number): Promise<true> {
    const bitmasks = await options.getPermissions(options, event);

    if (hasRequiredPermission(bitmasks, group as number, accessMask)) {
      return true;
    }

    throw options.forbiddenError(event);
  }

  function permaskMiddleware(group: Groups[keyof Groups], accessMask: number): H3MiddlewareLike {
    return async (event, next) => {
      await requirePermask(event, group, accessMask);
      return next?.();
    };
  }

  return { requirePermask, permaskMiddleware };
}
