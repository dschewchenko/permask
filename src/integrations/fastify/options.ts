import type { FastifyReply, FastifyRequest } from "fastify";
import { readPermissionBitmasks } from "../../utils/object";

/**
 * Options for `permaskFastify(...)`.
 */
export type PermaskFastifyOptions = {
  /**
   * Request property, where to get user permissions.
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
    opts: Required<PermaskFastifyOptions>,
    req: FastifyRequest
  ) => Array<number> | Promise<Array<number>>;

  /**
   * Callback to send a forbidden response.
   *
   * @default (reply) => reply.code(403).send({ error: "Access denied" })
   */
  forbiddenResponse?: (reply: FastifyReply) => FastifyReply | void | Promise<FastifyReply | void>;
};

/**
 * Default options for `permaskFastify(...)`.
 */
export const defaultPermaskFastifyOptions = {
  permissionsKey: "user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskFastifyOptions>, req: FastifyRequest) =>
    readPermissionBitmasks(req, permissionsKey),
  forbiddenResponse: (reply: FastifyReply) => reply.code(403).send({ error: "Access denied" })
} satisfies Required<PermaskFastifyOptions>;
