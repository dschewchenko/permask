import { describe, expect, it } from "vitest";
import {
  canDelete,
  canRead,
  canWrite,
  createBitmask,
  getPermissionAccess,
  getPermissionBitmask,
  getPermissionGroup,
  hasPermissionAccess,
  hasPermissionGroup,
  hasRequiredPermission,
  parseBitmask,
  setPermissionAccess,
  setPermissionGroup
} from "../";
import { PermissionAccess, PermissionAccessBitmasks } from "../constants/permission";

const TestPermissionGroup = {
  USER: 0,
  POST: 1,
  COMMENT: 2,
  LIKE: 3
} as const;

const bitmask0 = 0b000000; // 0 User, no access
const bitmask1 = 0b001111; // 15 Post, full access
const bitmask2 = 0b010001; // 21 Comment, read
const bitmask3 = 0b011111; // 31 Like, full access

describe("Permission Bitmask Utilities", () => {
  describe("createBitmask", () => {
    it("should create correct bitmask", () => {
      expect(createBitmask({ group: TestPermissionGroup.USER, read: false, write: false, delete: false })).toBe(
        bitmask0
      );
      expect(createBitmask({ group: TestPermissionGroup.POST, read: true, write: true, delete: true })).toBe(bitmask1);
      expect(createBitmask({ group: TestPermissionGroup.COMMENT, read: true, write: false, delete: false })).toBe(
        bitmask2
      );
      expect(createBitmask({ group: TestPermissionGroup.LIKE, read: true, write: true, delete: true })).toBe(bitmask3);
    });
  });

  describe("parseBitmask", () => {
    it("should parse bitmask to configuration", () => {
      expect(parseBitmask(bitmask0)).toEqual({
        group: TestPermissionGroup.USER,
        read: false,
        write: false,
        delete: false
      });
      expect(parseBitmask(bitmask1)).toEqual({
        group: TestPermissionGroup.POST,
        read: true,
        write: true,
        delete: true
      });
      expect(parseBitmask(bitmask2)).toEqual({
        group: TestPermissionGroup.COMMENT,
        read: true,
        write: false,
        delete: false
      });
      expect(parseBitmask(bitmask3)).toEqual({
        group: TestPermissionGroup.LIKE,
        read: true,
        write: true,
        delete: true
      });
    });
  });

  describe("getPermissionGroup", () => {
    it("should return correct group from bitmask", () => {
      expect(getPermissionGroup(bitmask0)).toBe(TestPermissionGroup.USER);
      expect(getPermissionGroup(bitmask1)).toBe(TestPermissionGroup.POST);
      expect(getPermissionGroup(bitmask2)).toBe(TestPermissionGroup.COMMENT);
      expect(getPermissionGroup(bitmask3)).toBe(TestPermissionGroup.LIKE);
    });
  });

  describe("hasPermissionAccess", () => {
    it("should correctly check access presence", () => {
      expect(hasPermissionAccess(bitmask0, PermissionAccess.READ)).toBe(false);
      expect(hasPermissionAccess(bitmask1, PermissionAccess.WRITE)).toBe(true);
      expect(hasPermissionAccess(bitmask2, PermissionAccess.DELETE)).toBe(false);
      expect(hasPermissionAccess(bitmask3, PermissionAccess.READ)).toBe(true);
    });
  });

  describe("hasPermissionGroup", () => {
    it("should correctly check group presence", () => {
      expect(hasPermissionGroup(bitmask0, TestPermissionGroup.USER)).toBe(true);
      expect(hasPermissionGroup(bitmask2, TestPermissionGroup.COMMENT)).toBe(true);
      expect(hasPermissionGroup(bitmask1, TestPermissionGroup.LIKE)).toBe(false);
    });
  });

  describe("getPermissionAccess", () => {
    it("should return correct access flags from bitmask", () => {
      expect(getPermissionAccess(bitmask0)).toBe(0b000);
      expect(getPermissionAccess(bitmask1)).toBe(0b111);
      expect(getPermissionAccess(bitmask2)).toBe(0b001);
      expect(getPermissionAccess(bitmask3)).toBe(0b111);
    });
  });

  describe("access checking utilities", () => {
    it("should verify read access", () => {
      expect(canRead(bitmask2)).toBe(true);
      expect(canRead(bitmask0)).toBe(false);
    });

    it("should verify write access", () => {
      expect(canWrite(bitmask1)).toBe(true);
      expect(canWrite(bitmask2)).toBe(false);
    });

    it("should verify delete access", () => {
      expect(canDelete(bitmask1)).toBe(true);
      expect(canDelete(bitmask0)).toBe(false);
    });
  });

  describe("setPermissionGroup", () => {
    it("should update group in bitmask", () => {
      const updated = setPermissionGroup(bitmask1, TestPermissionGroup.LIKE);
      expect(getPermissionGroup(updated)).toBe(TestPermissionGroup.LIKE);
    });
  });

  describe("setPermissionAccess", () => {
    it("should update access in bitmask", () => {
      const updated = setPermissionAccess(bitmask0, 0b111); // Full access
      expect(canRead(updated)).toBe(true);
      expect(canWrite(updated)).toBe(true);
      expect(canDelete(updated)).toBe(true);
    });
  });

  describe("hasRequiredPermission", () => {
    it("should return true if one of the bitmasks contains the required group and access", () => {
      const bitmasks = [bitmask0, bitmask1];
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.POST, PermissionAccess.WRITE)).toBe(true);
    });

    it("should return false if no bitmask contains the required group and access", () => {
      const bitmasks = [bitmask0, bitmask2];
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.POST, PermissionAccess.WRITE)).toBe(false);
    });

    it("should handle empty bitmask array", () => {
      const bitmasks: number[] = [];
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.POST, PermissionAccess.WRITE)).toBe(false);
    });
  });

  describe("getPermissionBitmask", () => {
    it("should create a bitmask from group and access", () => {
      expect(getPermissionBitmask(TestPermissionGroup.COMMENT, PermissionAccessBitmasks.READ)).toBe(bitmask2);
      expect(getPermissionBitmask(TestPermissionGroup.LIKE, PermissionAccessBitmasks.FULL)).toBe(bitmask3);
      expect(getPermissionBitmask(TestPermissionGroup.USER, 0b000)).toBe(bitmask0);
    });
  });
});
