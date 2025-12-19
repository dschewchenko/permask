import type { Context, Env, Input } from "hono";

/**
 * Options for `permaskHono(...)`.
 */
export type PermaskHonoOptions<E extends Env = Env, P extends string = string, I extends Input = Input> = {
  /**
   * Variable name used to read permissions from `c.get(...)` (recommended pattern in Hono).
   *
   * @default "permissions"
   */
  permissionsVariable?: string;

  /**
   * Callback to get permissions from the context.
   */
  getPermissions?: (opts: Required<PermaskHonoOptions<E, P, I>>, c: Context<E, P, I>) => number[] | Promise<number[]>;

  /**
   * Callback to return a forbidden response.
   *
   * @default (c) => c.json({ error: "Access denied" }, 403)
   */
  forbiddenResponse?: (c: Context<E, P, I>) => Response | undefined | Promise<Response | undefined>;
};

/**
 * Default options for `permaskHono(...)`.
 */
export const defaultPermaskHonoOptions: Required<PermaskHonoOptions> = {
  permissionsVariable: "permissions",
  getPermissions: ({ permissionsVariable }, c) => (c.get(permissionsVariable as never) as number[] | undefined) ?? [],
  forbiddenResponse: (c) => c.json({ error: "Access denied" }, 403)
};
