import { describe, expect, it } from "vitest";
import { createPermask } from "./";

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
        group: PermissionGroup.POSTS,
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
        group: PermissionGroup.LIKES,
        read: true,
        create: true,
        delete: false,
        update: true
      });

      expect(permask.hasGroup(bitmask, PermissionGroup.LIKES)).toBe(true);
      expect(permask.canRead(bitmask)).toBe(true);
      expect(permask.canCreate(bitmask)).toBe(true);
      expect(permask.canDelete(bitmask)).toBe(false);
      expect(permask.canUpdate(bitmask)).toBe(true);
    });
  });
});
