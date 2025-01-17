import type { NextFunction, Request, Response } from "express";
import { hasRequiredPermission } from "../../utils/bitmask";
import { type PermaskMiddlewareOptionsType, defaultPermaskMiddlewareOptions } from "./options";

/**
 * Create Express middleware for Permask.
 *
 * @example
 *
 * ```ts
 * import express from "express";
 * import { permaskExpress, PermissionAccess } from "permask";
 *
 * const app = express();
 *
 * const groups = {
 *   admin: 1,
 *   user: 2,
 *   // ...
 * } as const;
 *
 * const checkPermission = permaskExpress(groups);
 *
 * // to check permission for a route
 * app.get("/protected", checkPermissions(groups.admin, PermissionAccess.READ), (req, res) => {
 *   res.send("protected route");
 * });
 */
export function permaskExpress<Groups extends Record<string, number | string>>(
  groups: Groups,
  opts?: PermaskMiddlewareOptionsType
) {
  const options = { ...defaultPermaskMiddlewareOptions, ...opts };

  return function checkPermissions(group: Groups[keyof Groups], access: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const bitmasks = options.getPermissions(options, req);

        if (hasRequiredPermission(bitmasks, group as number, access)) {
          return next();
        }

        return options.forbiddenResponse(res);
      } catch (error) {
        // @ts-ignore
        return res.status(500).json({ error: "Internal server error", details: error.message });
      }
    };
  };
}
