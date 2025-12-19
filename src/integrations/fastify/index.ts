import type { preHandlerAsyncHookHandler } from "fastify";
import { hasRequiredPermission } from "../../utils/bitmask";
import { defaultPermaskFastifyOptions, type PermaskFastifyOptions } from "./options";

export type { PermaskFastifyOptions } from "./options";
export { defaultPermaskFastifyOptions } from "./options";

/**
 * Minimal Fastify preHandler hook signature.
 */
export type FastifyPreHandler = preHandlerAsyncHookHandler;

/**
 * PreHandler factory returned by {@link permaskFastify}.
 */
export type PermaskFastifyPreHandlerFactory<Groups extends Record<string, number | string>> = (
  group: Groups[keyof Groups],
  accessMask: number
) => FastifyPreHandler;

/**
 * Create Fastify preHandler hook factory for Permask.
 *
 * Default behavior reads permissions from `request.user.permissions` (configurable via `options.permissionsKey`).
 *
 * @example
 * ```ts
 * import Fastify from "fastify";
 * import { PermissionAccess } from "permask";
 * import { permaskFastify } from "permask/fastify";
 *
 * const fastify = Fastify();
 *
 * const groups = {
 *   admin: 1,
 *   user: 2,
 * } as const;
 *
 * // Authentication hook/plugin must populate `request.user.permissions` (number[] bitmasks).
 * fastify.addHook("preHandler", async (request, reply) => {
 *   const user = await authenticateRequest(request); // your code
 *   if (!user) return reply.code(401).send({ error: "Unauthorized" });
 *
 *   (request as any).user = { permissions: user.permissionsBitmasks };
 * });
 *
 * const checkPermission = permaskFastify(groups);
 *
 * fastify.get(
 *   "/protected",
 *   { preHandler: checkPermission(groups.admin, PermissionAccess.READ) },
 *   async () => "ok"
 * );
 * ```
 */
export function permaskFastify<Groups extends Record<string, number | string>>(
  _groups: Groups,
  opts?: PermaskFastifyOptions
): PermaskFastifyPreHandlerFactory<Groups> {
  const options = { ...defaultPermaskFastifyOptions, ...opts };

  return function checkPermissions(group: Groups[keyof Groups], accessMask: number): FastifyPreHandler {
    return async (request, reply) => {
      try {
        const bitmasks = await options.getPermissions(options, request);

        if (hasRequiredPermission(bitmasks, group as number, accessMask)) {
          return;
        }

        await options.forbiddenResponse(reply);
      } catch (error) {
        return reply.code(500).send({
          error: "Internal server error",
          // @ts-expect-error
          details: error?.message
        });
      }
    };
  };
}
