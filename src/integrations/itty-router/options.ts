import type { IRequest } from "itty-router";
import { get } from "../../utils/object";

/**
 * Options for `permaskIttyRouter(...)`.
 */
export type PermaskIttyRouterOptions = {
  /**
   * Request property, where to get permissions.
   *
   * @default "user.permissions"
   */
  permissionsKey?: string;

  /**
   * Callback to get permissions from request.
   *
   * @default ({ permissionsKey }, req) => get(req, permissionsKey, [])
   */
  getPermissions?: (opts: Required<PermaskIttyRouterOptions>, req: IRequest) => number[] | Promise<number[]>;

  /**
   * Callback to return a forbidden response.
   *
   * @default () => new Response(JSON.stringify({ error: "Access denied" }), { status: 403 })
   */
  forbiddenResponse?: (req: IRequest) => Response | Promise<Response>;
};

/**
 * Default options for `permaskIttyRouter(...)`.
 */
export const defaultPermaskIttyRouterOptions: Required<PermaskIttyRouterOptions> = {
  permissionsKey: "user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskIttyRouterOptions>, req: IRequest) =>
    get(req as unknown as Record<string, unknown>, permissionsKey, []) as number[],
  forbiddenResponse: () =>
    new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "content-type": "application/json" }
    })
};
