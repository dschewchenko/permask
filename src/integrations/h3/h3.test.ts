import { describe, expect, it, vi } from "vitest";
import { PermissionAccess } from "../../constants/permission";
import { createBitmask } from "../../utils/bitmask";
import { permaskH3 } from "./";

const groups = {
  POST: 1
} as const;

describe("permask H3 integration", () => {
  it("requirePermask resolves when permission matches", async () => {
    const { requirePermask } = permaskH3(groups);

    const event = {
      context: { user: { permissions: [createBitmask({ group: groups.POST, read: true })] } }
    } as any;

    await expect(requirePermask(event, groups.POST, PermissionAccess.READ)).resolves.toBe(true);
  });

  it("requirePermask throws forbidden error when permission is missing", async () => {
    const { requirePermask } = permaskH3(groups);

    const event = { context: { user: { permissions: [] } } } as any;

    await expect(requirePermask(event, groups.POST, PermissionAccess.READ)).rejects.toMatchObject({ status: 403 });
  });

  it("permaskMiddleware calls next when allowed", async () => {
    const { permaskMiddleware } = permaskH3(groups);

    const event = {
      context: { user: { permissions: [createBitmask({ group: groups.POST, read: true })] } }
    } as any;

    const next = vi.fn().mockResolvedValue("ok");
    const middleware = permaskMiddleware(groups.POST, PermissionAccess.READ);

    await expect(middleware(event, next)).resolves.toBe("ok");
    expect(next).toHaveBeenCalled();
  });

  it("permaskMiddleware throws when forbidden", async () => {
    const { permaskMiddleware } = permaskH3(groups);

    const event = { context: { user: { permissions: [] } } } as any;
    const next = vi.fn();
    const middleware = permaskMiddleware(groups.POST, PermissionAccess.READ);

    await expect(middleware(event, next)).rejects.toMatchObject({ status: 403 });
    expect(next).not.toHaveBeenCalled();
  });
});

