import { describe, expect, it, vi } from "vitest";
import { PermissionAccess } from "../../constants/permission";
import { createBitmask } from "../../utils/bitmask";
import { permaskFastify } from "./";

const groups = {
  POST: 1
} as const;

describe("permask Fastify integration", () => {
  it("allows when permission matches", async () => {
    const check = permaskFastify(groups);
    const hook = check(groups.POST, PermissionAccess.READ);

    const request = {
      user: { permissions: [createBitmask({ group: groups.POST, read: true })] }
    } as any;

    const reply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    } as any;

    await hook(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
    expect(reply.send).not.toHaveBeenCalled();
  });

  it("denies when permission is missing", async () => {
    const check = permaskFastify(groups);
    const hook = check(groups.POST, PermissionAccess.READ);

    const request = { user: { permissions: [] } } as any;
    const reply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    } as any;

    await hook(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
    expect(reply.send).toHaveBeenCalledWith({ error: "Access denied" });
  });

  it("returns 500 when getPermissions throws", async () => {
    const check = permaskFastify(groups, {
      getPermissions: () => {
        throw new Error("boom");
      }
    });
    const hook = check(groups.POST, PermissionAccess.READ);

    const request = {} as any;
    const reply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis()
    } as any;

    await hook(request, reply);

    expect(reply.code).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({ error: "Internal server error", details: "boom" });
  });
});

