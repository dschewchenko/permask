import { describe, expect, it } from "vitest";
import { formatBitmask, getPermissionBitmask, PermissionAccess } from "../";

describe("formatBitmask", () => {
  const groups = { POSTS: 1, COMMENTS: 2 } as const;

  it("should format with numeric group when no groups are provided", () => {
    const bitmask = getPermissionBitmask(1, PermissionAccess.READ | PermissionAccess.DELETE);
    expect(formatBitmask(bitmask)).toBe("1:read|delete");
  });

  it("should format with group name when groups are provided", () => {
    const bitmask = getPermissionBitmask(1, PermissionAccess.READ | PermissionAccess.DELETE);
    expect(formatBitmask(bitmask, groups)).toBe("POSTS:read|delete");
  });

  it("should format empty access as none", () => {
    const bitmask = getPermissionBitmask(2, 0);
    expect(formatBitmask(bitmask, groups)).toBe("COMMENTS:none");
  });

  it("should support includeGroupId option", () => {
    const bitmask = getPermissionBitmask(1, PermissionAccess.READ);
    expect(formatBitmask(bitmask, groups, { includeGroupId: true })).toBe("POSTS(1):read");
  });
});
