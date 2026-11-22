import type { IRequest } from "itty-router";
import { readPermissionBitmasks } from "../../utils/object";

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
   * @default ({ permissionsKey }, req) => readPermissionBitmasks(req, permissionsKey)
   */
  getPermissions?: (opts: Required<PermaskIttyRouterOptions>, req: IRequest) => Array<number> | Promise<Array<number>>;

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
    readPermissionBitmasks(req, permissionsKey),
  forbiddenResponse: () =>
    new Response(JSON.stringify({ error: "Access denied" }), {
      status: 403,
      headers: { "content-type": "application/json" }
    })
};
