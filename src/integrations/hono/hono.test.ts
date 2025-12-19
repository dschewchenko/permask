import { describe, expect, it, vi } from "vitest";
import { PermissionAccess } from "../../constants/permission";
import { createBitmask } from "../../utils/bitmask";
import { permaskHono } from "./";

const groups = {
  POST: 1
} as const;

describe("permask Hono integration", () => {
  it("calls next when allowed", async () => {
    const check = permaskHono(groups);
    const middleware = check(groups.POST, PermissionAccess.READ);

    const store = new Map<string, unknown>();
    store.set("permissions", [createBitmask({ group: groups.POST, read: true })]);

    const c = {
      get: (key: string) => store.get(key),
      json: vi.fn()
    } as any;

    const next = vi.fn().mockResolvedValue("ok");

    await expect(middleware(c, next)).resolves.toBe("ok");
    expect(next).toHaveBeenCalled();
    expect(c.json).not.toHaveBeenCalled();
  });

  it("returns forbidden response when missing permission", async () => {
    const check = permaskHono(groups);
    const middleware = check(groups.POST, PermissionAccess.READ);

    const c = {
      get: (_key: string) => undefined,
      json: vi.fn((body: unknown, status: number) => new Response(JSON.stringify(body), { status }))
    } as any;

    const next = vi.fn();
    const res = (await middleware(c, next)) as Response;

    expect(next).not.toHaveBeenCalled();
    expect(c.json).toHaveBeenCalledWith({ error: "Access denied" }, 403);
    expect(res.status).toBe(403);
  });

  it("returns 500 when getPermissions throws", async () => {
    const check = permaskHono(groups, {
      getPermissions: () => {
        throw new Error("boom");
      }
    });
    const middleware = check(groups.POST, PermissionAccess.READ);

    const c = {
      get: vi.fn(),
      json: vi.fn((body: unknown, status: number) => new Response(JSON.stringify(body), { status }))
    } as any;

    const res = (await middleware(c, vi.fn())) as Response;
    const payload = await res.json();

    expect(res.status).toBe(500);
    expect(payload).toEqual({ error: "Internal server error", details: "boom" });
  });
});
