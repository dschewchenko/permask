import type { NextFunction, Request, Response } from "express";
import { hasRequiredPermission } from "../../utils/bitmask";
import { defaultPermaskExpressOptions, type PermaskExpressOptions } from "./options";

export type { PermaskExpressOptions } from "./options";
export { defaultPermaskExpressOptions } from "./options";

/**
 * Minimal Express middleware signature.
 */
export type ExpressMiddlewareLike = (req: Request, res: Response, next: NextFunction) => void;

/**
 * Middleware factory returned by {@link permaskExpress}.
 *
 * Call it with `(group, accessMask)` to get an Express middleware that calls `next()` when allowed
 * and otherwise triggers `options.forbiddenResponse(res)`.
 */
export type PermaskExpressMiddlewareFactory<Groups extends Record<string, number | string>> = (
  group: Groups[keyof Groups],
  accessMask: number
) => ExpressMiddlewareLike;

function isThenable<T>(value: unknown): value is PromiseLike<T> {
  return typeof (value as { then?: unknown } | null | undefined)?.then === "function";
}

function sendInternalError(res: Response, error: unknown) {
  const details = error instanceof Error ? error.message : String(error);
  return res.status(500).json({ error: "Internal server error", details });
}

/**
 * Create Express middleware factory for Permask.
 *
 * Default behavior:
 * - Reads permissions from `req.user.permissions` (configurable via `options.permissionsKey`)
 * - Supports sync/async `getPermissions(...)` (works in both Express v4 and v5)
 *
 * @example
 *
 * ```ts
 * import express from "express";
 * import { PermissionAccess } from "permask";
 * import { permaskExpress } from "permask/express";
 *
 * const app = express();
 *
 * const groups = {
 *   admin: 1,
 *   user: 2,
 *   // ...
 * } as const;
 *
 * // Authentication middleware must populate `req.user.permissions` (number[] bitmasks).
 * app.use((req, _res, next) => {
 *   (req as any).user = { permissions: [1, 2, 3] };
 *   next();
 * });
 *
 * const checkPermission = permaskExpress(groups);
 *
 * app.get("/protected", checkPermission(groups.admin, PermissionAccess.READ), (_req, res) => {
 *   res.send("protected route");
 * });
 * ```
 */
export function permaskExpress<Groups extends Record<string, number | string>>(
  _groups: Groups,
  opts?: PermaskExpressOptions
): PermaskExpressMiddlewareFactory<Groups> {
  const options = { ...defaultPermaskExpressOptions, ...opts };

  return function checkPermissions(group: Groups[keyof Groups], accessMask: number) {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        const bitmasksOrPromise = options.getPermissions(options, req);

        const handleForbidden = () => {
          try {
            const maybePromise = options.forbiddenResponse(res);
            if (isThenable(maybePromise)) {
              Promise.resolve(maybePromise).catch((error: unknown) => sendInternalError(res, error));
            }
          } catch (error) {
            sendInternalError(res, error);
          }
        };

        const handleBitmasks = (bitmasks: number[]) => {
          if (hasRequiredPermission(bitmasks, group as number, accessMask)) {
            return next();
          }
          return handleForbidden();
        };

        if (isThenable<number[]>(bitmasksOrPromise)) {
          Promise.resolve(bitmasksOrPromise)
            .then(handleBitmasks)
            .catch((error: unknown) => sendInternalError(res, error));
          return;
        }

        return handleBitmasks(bitmasksOrPromise);
      } catch (error) {
        return sendInternalError(res, error);
      }
    };
  };
}
