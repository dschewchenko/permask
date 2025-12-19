import { describe, expect, it } from "vitest";
import { PermissionAccess } from "../../constants/permission";
import { createBitmask } from "../../utils/bitmask";
import { permaskIttyRouter } from "./";

const groups = {
  POST: 1
} as const;

describe("permask itty-router integration", () => {
  it("returns undefined when allowed (lets router continue)", async () => {
    const check = permaskIttyRouter(groups);
    const handler = check(groups.POST, PermissionAccess.READ);

    const req = {
      user: { permissions: [createBitmask({ group: groups.POST, read: true })] }
    } as any;

    await expect(handler(req)).resolves.toBeUndefined();
  });

  it("returns Response(403) when forbidden", async () => {
    const check = permaskIttyRouter(groups);
    const handler = check(groups.POST, PermissionAccess.READ);

    const req = { user: { permissions: [] } } as any;
    const res = (await handler(req)) as Response;

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toEqual({ error: "Access denied" });
  });

  it("returns Response(500) when getPermissions throws", async () => {
    const check = permaskIttyRouter(groups, {
      getPermissions: () => {
        throw new Error("boom");
      }
    });
    const handler = check(groups.POST, PermissionAccess.READ);

    const req = {} as any;
    const res = (await handler(req)) as Response;

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Internal server error" });
  });
});

