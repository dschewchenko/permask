import type { IRequest, RequestHandler } from "itty-router";
import { hasRequiredPermission } from "../../utils/bitmask";
import { defaultPermaskIttyRouterOptions, type PermaskIttyRouterOptions } from "./options";

export type { PermaskIttyRouterOptions } from "./options";
export { defaultPermaskIttyRouterOptions } from "./options";

export type IttyRouterHandlerLike = RequestHandler<IRequest>;

/**
 * Create itty-router handler/middleware factory for Permask.
 *
 * Compatible with `before` middleware and route handlers (return `Response` to short-circuit).
 *
 * @example
 * ```ts
 * import { Router } from "itty-router";
 * import { PermissionAccess } from "permask";
 * import { permaskIttyRouter } from "permask/itty-router";
 *
 * const groups = { admin: 1 } as const;
 * const router = Router();
 *
 * const checkPermission = permaskIttyRouter(groups);
 *
 * router.before(async (req) => {
 *   const user = await authenticateRequest(req); // your code
 *   if (!user) return new Response("Unauthorized", { status: 401 });
 *
 *   (req as any).user = { permissions: user.permissionsBitmasks }; // number[] bitmasks
 * });
 *
 * router.before(checkPermission(groups.admin, PermissionAccess.READ));
 * router.get("/protected", () => new Response("ok"));
 * ```
 */
export type PermaskIttyRouterHandlerFactory<Groups extends Record<string, number | string>> = (
  group: Groups[keyof Groups],
  accessMask: number
) => IttyRouterHandlerLike;

export function permaskIttyRouter<Groups extends Record<string, number | string>>(
  _groups: Groups,
  opts?: PermaskIttyRouterOptions
): PermaskIttyRouterHandlerFactory<Groups> {
  const options = { ...defaultPermaskIttyRouterOptions, ...opts };

  return function checkPermissions(group: Groups[keyof Groups], accessMask: number): IttyRouterHandlerLike {
    return async (req) => {
      try {
        const bitmasks = await options.getPermissions(options, req);

        if (hasRequiredPermission(bitmasks, group as number, accessMask)) {
          return;
        }

        return options.forbiddenResponse(req);
      } catch (_error) {
        return new Response(JSON.stringify({ error: "Internal server error" }), {
          status: 500,
          headers: { "content-type": "application/json" }
        });
      }
    };
  };
}
