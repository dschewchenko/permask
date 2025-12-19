import { describe, expect, it, vi } from "vitest";
import { PermissionAccess } from "../../constants/permission";
import { createBitmask } from "../../utils/bitmask";
import { permaskElysia } from "./";

const groups = {
  POST: 1
} as const;

describe("permask Elysia integration", () => {
  it("allows when permission matches", async () => {
    const check = permaskElysia(groups);
    const beforeHandle = check(groups.POST, PermissionAccess.READ);

    const ctx = {
      store: { user: { permissions: [createBitmask({ group: groups.POST, read: true })] } },
      status: vi.fn()
    } as any;

    await beforeHandle(ctx);

    expect(ctx.status).not.toHaveBeenCalled();
  });

  it("returns forbidden response when permission is missing", async () => {
    const check = permaskElysia(groups);
    const beforeHandle = check(groups.POST, PermissionAccess.READ);

    const ctx = {
      store: { user: { permissions: [] } },
      status: vi.fn().mockReturnValue("forbidden")
    } as any;

    const result = await beforeHandle(ctx);

    expect(ctx.status).toHaveBeenCalledWith(403);
    expect(result).toBe("forbidden");
  });

  it("returns 500 when getPermissions throws", async () => {
    const check = permaskElysia(groups, {
      getPermissions: () => {
        throw new Error("boom");
      }
    });
    const beforeHandle = check(groups.POST, PermissionAccess.READ);

    const ctx = {
      store: {},
      status: vi.fn().mockReturnValue("internal")
    } as any;

    const result = await beforeHandle(ctx);

    expect(ctx.status).toHaveBeenCalledWith(500);
    expect(result).toBe("internal");
  });
});

