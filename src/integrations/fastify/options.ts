import type { FastifyReply, FastifyRequest } from "fastify";
import { get } from "../../utils/object";

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
   * @default ({ permissionsKey }, req) => get(req, permissionsKey, [])
   */
  getPermissions?: (opts: Required<PermaskFastifyOptions>, req: FastifyRequest) => number[] | Promise<number[]>;

  /**
   * Callback to send a forbidden response.
   *
   * @default (reply) => reply.code(403).send({ error: "Access denied" })
   */
  forbiddenResponse?: (reply: FastifyReply) => unknown | Promise<unknown>;
};

/**
 * Default options for `permaskFastify(...)`.
 */
export const defaultPermaskFastifyOptions: Required<PermaskFastifyOptions> = {
  permissionsKey: "user.permissions",
  getPermissions: ({ permissionsKey }: Required<PermaskFastifyOptions>, req: FastifyRequest) =>
    get(req as unknown as Record<string, unknown>, permissionsKey, []) as number[],
  forbiddenResponse: (reply: FastifyReply) => reply.code(403).send({ error: "Access denied" })
};
