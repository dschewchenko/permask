import { type PathPropertyValue, readPermissionBitmasks } from "../../utils/object";

export type PermaskMetadataTarget = object;

export type NestRequestLike = Record<string, PathPropertyValue>;

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
   * @default ({ permissionsKey }, req) => readPermissionBitmasks(req, permissionsKey)
   */
  getPermissions?: (
    opts: Required<PermaskNestjsOptions>,
    req: NestRequestLike
  ) => Array<number> | Promise<Array<number>>;
};

/**
 * Default options for `permaskNestjs(...)`.
 */
export const defaultPermaskNestjsOptions: Required<PermaskNestjsOptions> = {
  permissionsKey: "user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskNestjsOptions>, req: NestRequestLike) =>
    readPermissionBitmasks(req, permissionsKey)
};

export type PermaskRequirement = {
  group: number;
  accessMask: number;
};
