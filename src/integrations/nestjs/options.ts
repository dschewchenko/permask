import { get } from "../../utils/object";

export type NestRequestLike = Record<string, unknown>;

/**
 * Options for `permaskNestjs(...)`.
 */
export type PermaskNestjsOptions = {
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
  getPermissions?: (opts: Required<PermaskNestjsOptions>, req: NestRequestLike) => number[] | Promise<number[]>;
};

/**
 * Default options for `permaskNestjs(...)`.
 */
export const defaultPermaskNestjsOptions: Required<PermaskNestjsOptions> = {
  permissionsKey: "user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskNestjsOptions>, req: NestRequestLike) =>
    get(req, permissionsKey, []) as number[]
};

export type PermaskRequirement = {
  group: number;
  accessMask: number;
};
