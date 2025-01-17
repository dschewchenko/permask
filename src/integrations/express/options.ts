import type { Request, Response } from "express";
import { get } from "../../utils/object";

export type PermaskMiddlewareOptionsType = {
  /**
   * Request property, where to get user permissions.
   *
   * @default "user.permissions"
   */
  permissionsKey?: string;

  /**
   * Callback to get permissions from request and store them in the request property.
   *
   * @default ({ property, permissionsKey }: Required<PermaskMiddlewareOptions>, req: Record<string, unknown>) => get(req, permissionsKey)
   */
  getPermissions?: (opts: Required<PermaskMiddlewareOptionsType>, req: Request) => number[];

  /**
   * Callback to send a forbidden response.
   *
   * @default (res) => res.status(403).json({ error: "Access denied" })
   */
  forbiddenResponse?: (res: Response) => void;
};

export const defaultPermaskMiddlewareOptions: Required<PermaskMiddlewareOptionsType> = {
  permissionsKey: "user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskMiddlewareOptionsType>, req: Request) =>
    get(req as unknown as Record<string, unknown>, permissionsKey, []) as number[],
  forbiddenResponse: (res: Response) => res.status(403).json({ error: "Access denied" })
};
