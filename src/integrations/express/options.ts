import type { Request, Response } from "express";
import { get } from "../../utils/object";

/**
 * Options for {@link permaskExpress}.
 */
export type PermaskExpressOptions = {
  /**
   * Request property, where to get user permissions.
   *
   * @default "user.permissions"
   */
  permissionsKey?: string;

  /**
   * Callback to get permissions from request and store them in the request property.
   *
   * @default ({ permissionsKey }, req) => get(req, permissionsKey, [])
   */
  getPermissions?: (opts: Required<PermaskExpressOptions>, req: Request) => number[] | Promise<number[]>;

  /**
   * Callback to send a forbidden response.
   *
   * @default (res) => res.status(403).json({ error: "Access denied" })
   */
  forbiddenResponse?: (res: Response) => unknown | Promise<unknown>;
};

/**
 * Default options for {@link permaskExpress}.
 *
 * Exposed so you can spread and override while keeping typing:
 * `permaskExpress(groups, { ...defaultPermaskExpressOptions, getPermissions: ... })`
 */
export const defaultPermaskExpressOptions: Required<PermaskExpressOptions> = {
  permissionsKey: "user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskExpressOptions>, req: Request) =>
    get(req as unknown as Record<string, unknown>, permissionsKey, []) as number[],
  forbiddenResponse: (res: Response) => res.status(403).json({ error: "Access denied" })
};
