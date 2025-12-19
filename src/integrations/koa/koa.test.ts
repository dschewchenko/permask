import { describe, expect, it, vi } from "vitest";
import { PermissionAccess } from "../../constants/permission";
import { createBitmask } from "../../utils/bitmask";
import { permaskKoa } from "./";

const groups = {
  POST: 1
} as const;

describe("permask Koa integration", () => {
  it("calls next when allowed", async () => {
    const check = permaskKoa(groups);
    const middleware = check(groups.POST, PermissionAccess.READ);

    const ctx = {
      state: { user: { permissions: [createBitmask({ group: groups.POST, read: true })] } }
    } as any;

    const next = vi.fn().mockResolvedValue("ok");

    await expect(middleware(ctx, next)).resolves.toBe("ok");
    expect(next).toHaveBeenCalled();
  });

  it("sets forbidden response when missing permission", async () => {
    const check = permaskKoa(groups);
    const middleware = check(groups.POST, PermissionAccess.READ);

    const ctx = {
      state: { user: { permissions: [] } }
    } as any;

    const next = vi.fn();

    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.status).toBe(403);
    expect(ctx.body).toEqual({ error: "Access denied" });
  });

  it("sets 500 when getPermissions throws", async () => {
    const check = permaskKoa(groups, {
      getPermissions: () => {
        throw new Error("boom");
      }
    });
    const middleware = check(groups.POST, PermissionAccess.READ);

    const ctx = { state: {} } as any;
    const next = vi.fn();

    await middleware(ctx, next);

    expect(ctx.status).toBe(500);
    expect(ctx.body).toEqual({ error: "Internal server error", details: "boom" });
  });
});

