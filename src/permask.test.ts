import { describe, expect, it } from "vitest";
import { createPermask } from "./";

enum PermissionGroup {
  POSTS = 1,
  LIKES = 2,
  COMMENTS = 3
}

const postsReadWrite = 0b1101;
const invalidGroup = 0b100111;

describe("Permask", () => {
  describe("createPermask", () => {
    const permask = createPermask(PermissionGroup);

    it("should create a bitmask correctly", () => {
      const bitmask = permask.create({
        group: PermissionGroup.POSTS,
        read: true,
        write: false,
        delete: true
      });

      expect(bitmask).toBe(postsReadWrite);
    });

    it("should parse a bitmask correctly", () => {
      const parsed = permask.parse(postsReadWrite);
      expect(parsed).toEqual({
        group: PermissionGroup.POSTS,
        read: true,
        write: false,
        delete: true
      });
    });

    it("should return group name from bitmask", () => {
      const groupName = permask.getGroupName(postsReadWrite);
      expect(groupName).toBe("POSTS");

      const undefinedGroup = permask.getGroupName(invalidGroup);
      expect(undefinedGroup).toBeUndefined();
    });

    it("should check group presence in a bitmask", () => {
      const hasGroup = permask.hasGroup(postsReadWrite, PermissionGroup.POSTS);
      expect(hasGroup).toBe(true);

      const noGroup = permask.hasGroup(invalidGroup, PermissionGroup.LIKES);
      expect(noGroup).toBe(false);
    });

    it("should check read, write, and delete access", () => {
      const bitmask = permask.create({
        group: PermissionGroup.LIKES,
        read: true,
        write: true,
        delete: false
      });

      expect(permask.hasGroup(bitmask, PermissionGroup.LIKES)).toBe(true);
      expect(permask.canRead(bitmask)).toBe(true);
      expect(permask.canWrite(bitmask)).toBe(true);
      expect(permask.canDelete(bitmask)).toBe(false);
    });
  });
});
