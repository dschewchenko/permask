import type { H3Event } from "h3";
import { type PermaskH3Integration, type PermaskH3Options, permaskH3 } from "../h3";

export type { H3Event } from "h3";
export type { PermaskH3Options } from "../h3";
export { defaultPermaskH3Options } from "../h3";

/**
 * Minimal Nitro/H3 handler signature (enough for wrapper helpers).
 */
export type NitroEventHandlerLike = (event: H3Event) => unknown | Promise<unknown>;

/**
 * Nitro helpers returned by {@link permaskNitro}.
 */
export type PermaskNitroIntegration<Groups extends Record<string, number | string>> = PermaskH3Integration<Groups> & {
  /**
   * Wrap a Nitro (H3) handler with a permission check.
   *
   * It runs {@link PermaskH3Integration.requirePermask} before your handler.
   *
   * @example
   * ```ts
   * import { defineEventHandler } from "h3";
   * import { PermissionAccess } from "permask";
   * import { permaskNitro } from "permask/nitro";
   *
   * const groups = { admin: 1 } as const;
   * const { protect } = permaskNitro(groups);
   *
   * // Auth middleware must populate `event.context.user.permissions` (number[] bitmasks),
   * // or override `getPermissions(...)` in options.
   * export default protect(groups.admin, PermissionAccess.READ, defineEventHandler(() => "ok"));
   * ```
   */
  protect: (group: Groups[keyof Groups], accessMask: number, handler: NitroEventHandlerLike) => NitroEventHandlerLike;
};

/**
 * Create Nitro helpers for Permask.
 *
 * Nitro uses H3 events, so this integration is a thin wrapper around {@link permaskH3}
 * and adds a convenient `protect(...)` wrapper.
 *
 * @example
 * ```ts
 * import { defineEventHandler } from "h3";
 * import { PermissionAccess } from "permask";
 * import { permaskNitro } from "permask/nitro";
 *
 * const groups = { admin: 1 } as const;
 * const { protect } = permaskNitro(groups, {
 *   // Authenticate (JWT/session) and return permission bitmasks.
 *   getPermissions: async (_opts, event) => {
 *     const user = await authenticateRequest(event); // your code
 *     return user?.permissionsBitmasks ?? [];
 *   }
 * });
 *
 * export default protect(groups.admin, PermissionAccess.READ, defineEventHandler(() => "ok"));
 * ```
 */
export function permaskNitro<Groups extends Record<string, number | string>>(
  groups: Groups,
  opts?: PermaskH3Options
): PermaskNitroIntegration<Groups> {
  const h3 = permaskH3(groups, opts);

  function protect(
    group: Groups[keyof Groups],
    accessMask: number,
    handler: NitroEventHandlerLike
  ): NitroEventHandlerLike {
    return async (event) => {
      await h3.requirePermask(event, group, accessMask);
      return handler(event);
    };
  }

  return { ...h3, protect };
}
