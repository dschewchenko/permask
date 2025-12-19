import { describe, expect, it } from "vitest";
import { createPermask, PermaskError } from "./";
import { PermissionAccess } from "./constants/permission";

enum PermissionGroup {
  POSTS = 1,
  LIKES = 2,
  COMMENTS = 3
}

const postsReadDeleteUpdate = 0b10000 | 0b1001; // 25 = (POSTS << 4) | (READ | DELETE)
const invalidGroup = 0b1010000 | 0b0111; // Group 5 (not in enum) with some permissions

describe("Permask", () => {
  describe("createPermask", () => {
    const permask = createPermask(PermissionGroup);

    it("should create a bitmask correctly", () => {
      const bitmask = permask.create({
        group: "POSTS",
        read: true,
        create: false,
        delete: true,
        update: false
      });

      expect(bitmask).toBe(postsReadDeleteUpdate);
    });

    it("should parse a bitmask correctly", () => {
      const parsed = permask.parse(postsReadDeleteUpdate);
      expect(parsed).toEqual({
        group: PermissionGroup.POSTS,
        groupName: "POSTS",
        read: true,
        create: false,
        delete: true,
        update: false
      });
    });

    it("should return group name from bitmask", () => {
      const groupName = permask.getGroupName(postsReadDeleteUpdate);
      expect(groupName).toBe("POSTS");

      const undefinedGroup = permask.getGroupName(invalidGroup);
      expect(undefinedGroup).toBeUndefined();
    });

    it("should check group presence in a bitmask", () => {
      const hasGroup = permask.hasGroup(postsReadDeleteUpdate, PermissionGroup.POSTS);
      expect(hasGroup).toBe(true);

      const noGroup = permask.hasGroup(invalidGroup, PermissionGroup.LIKES);
      expect(noGroup).toBe(false);
    });

    it("should check read, create, delete, and update access", () => {
      const bitmask = permask.create({
        group: "LIKES",
        read: true,
        create: true,
        delete: false,
        update: true
      });

      expect(permask.hasGroup(bitmask, "LIKES")).toBe(true);
      expect(permask.canRead(bitmask)).toBe(true);
      expect(permask.canCreate(bitmask)).toBe(true);
      expect(permask.canDelete(bitmask)).toBe(false);
      expect(permask.canUpdate(bitmask)).toBe(true);
    });

    it("should check hasAccess method with group and access type", () => {
      const bitmask = permask.create({
        group: "COMMENTS",
        read: true,
        create: false,
        delete: true,
        update: false
      });

      // Test with string group names and string access
      expect(permask.hasAccess(bitmask, "COMMENTS", "read")).toBe(true);
      expect(permask.hasAccess(bitmask, "COMMENTS", "create")).toBe(false);
      expect(permask.hasAccess(bitmask, "COMMENTS", "delete")).toBe(true);
      expect(permask.hasAccess(bitmask, "COMMENTS", "update")).toBe(false);

      // Test with numeric group IDs and string access
      expect(permask.hasAccess(bitmask, PermissionGroup.COMMENTS, "read")).toBe(true);
      expect(permask.hasAccess(bitmask, PermissionGroup.COMMENTS, "create")).toBe(false);

      // Test with string group names and numeric access (PermissionAccessBits)
      expect(permask.hasAccess(bitmask, "COMMENTS", PermissionAccess.READ)).toBe(true);
      expect(permask.hasAccess(bitmask, "COMMENTS", PermissionAccess.CREATE)).toBe(false);
      expect(permask.hasAccess(bitmask, "COMMENTS", PermissionAccess.DELETE)).toBe(true);
      expect(permask.hasAccess(bitmask, "COMMENTS", PermissionAccess.UPDATE)).toBe(false);

      // Test with numeric group IDs and numeric access (PermissionAccessBits)
      expect(permask.hasAccess(bitmask, PermissionGroup.COMMENTS, PermissionAccess.READ)).toBe(true);
      expect(permask.hasAccess(bitmask, PermissionGroup.COMMENTS, PermissionAccess.CREATE)).toBe(false);
      expect(permask.hasAccess(bitmask, PermissionGroup.COMMENTS, PermissionAccess.DELETE)).toBe(true);
      expect(permask.hasAccess(bitmask, PermissionGroup.COMMENTS, PermissionAccess.UPDATE)).toBe(false);

      // Test with wrong group
      expect(permask.hasAccess(bitmask, "POSTS", "read")).toBe(false);
      expect(permask.hasAccess(bitmask, PermissionGroup.POSTS, "read")).toBe(false);
      expect(permask.hasAccess(bitmask, "POSTS", PermissionAccess.READ)).toBe(false);
      expect(permask.hasAccess(bitmask, PermissionGroup.POSTS, PermissionAccess.READ)).toBe(false);
    });

    it("should handle non-existent group when creating bitmask", () => {
      expect(() =>
        permask.create({
          // biome-ignore lint/suspicious/noExplicitAny: intentional invalid group for test case
          group: "NON_EXISTENT_GROUP" as any,
          read: true,
          create: true,
          delete: false,
          update: false
        })
      ).toThrowError(PermaskError);
    });

    it("should return false when checking hasGroup with non-existent group", () => {
      const bitmask = permask.create({
        group: "POSTS",
        read: true,
        create: false,
        delete: true,
        update: false
      });

      // Test with non-existent string group name
      // biome-ignore lint/suspicious/noExplicitAny: intentional invalid group for test case
      expect(permask.hasGroup(bitmask, "NON_EXISTENT_GROUP" as any)).toBe(false);

      // Test with non-existent numeric group ID
      expect(permask.hasGroup(bitmask, 999)).toBe(false);
    });

    it("should create bitmask with numeric group ID", () => {
      // When group is passed as number instead of string
      const bitmask = permask.create({
        group: PermissionGroup.LIKES, // Pass numeric group ID directly
        read: true,
        create: false,
        delete: true,
        update: false
      });

      // Should create the same bitmask as using string group name
      const expectedBitmask = permask.create({
        group: "LIKES",
        read: true,
        create: false,
        delete: true,
        update: false
      });

      expect(bitmask).toBe(expectedBitmask);
      expect(permask.hasGroup(bitmask, PermissionGroup.LIKES)).toBe(true);
      expect(permask.hasGroup(bitmask, "LIKES")).toBe(true);
    });
  });
});
