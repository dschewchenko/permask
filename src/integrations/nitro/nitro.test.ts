import { describe, expect, it, vi } from "vitest";
import { PermissionAccess } from "../../constants/permission";
import { createBitmask } from "../../utils/bitmask";
import { permaskNitro } from "./";

const groups = {
  POST: 1
} as const;

describe("permask Nitro integration", () => {
  it("protect calls handler when allowed", async () => {
    const { protect } = permaskNitro(groups);

    const handler = vi.fn().mockResolvedValue("ok");
    const protectedHandler = protect(groups.POST, PermissionAccess.READ, handler);

    const event = {
      context: { user: { permissions: [createBitmask({ group: groups.POST, read: true })] } }
    } as any;

    await expect(protectedHandler(event)).resolves.toBe("ok");
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("protect throws when forbidden", async () => {
    const { protect } = permaskNitro(groups);

    const handler = vi.fn();
    const protectedHandler = protect(groups.POST, PermissionAccess.READ, handler);

    const event = {
      context: { user: { permissions: [] } }
    } as any;

    await expect(protectedHandler(event)).rejects.toMatchObject({ status: 403 });
    expect(handler).not.toHaveBeenCalled();
  });
});

