import { describe, expect, it } from "vitest";
import {
  canDelete,
  canRead,
  canUpdate,
  canCreate,
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

// With 4-bit system: group bits shifted left by 4, not 3
const bitmask0 = 0b00000; // 0 User, no access
const bitmask1 = 0b10000 | 0b1111; // 31 = POST (1) << 4 | FULL ACCESS (15)
const bitmask2 = 0b100000 | 0b0001; // 33 = COMMENT (2) << 4 | READ (1)
const bitmask3 = 0b110000 | 0b1111; // 63 = LIKE (3) << 4 | FULL ACCESS (15)
const bitmaskWithUpdate = 0b10000 | 0b0101; // 21 = POST (1) << 4 | READ+UPDATE (5)

describe("Permission Bitmask Utilities", () => {
  describe("createBitmask", () => {
    it("should create correct bitmask", () => {
      expect(createBitmask({ group: TestPermissionGroup.USER, read: false, create: false, delete: false, update: false })).toBe(
        bitmask0
      );
      expect(createBitmask({ group: TestPermissionGroup.POST, read: true, create: true, delete: true, update: true })).toBe(bitmask1);
      expect(createBitmask({ group: TestPermissionGroup.COMMENT, read: true, create: false, delete: false, update: false })).toBe(
        bitmask2
      );
      expect(createBitmask({ group: TestPermissionGroup.LIKE, read: true, create: true, delete: true, update: true })).toBe(bitmask3);
      expect(createBitmask({ group: TestPermissionGroup.POST, read: true, create: false, delete: false, update: true })).toBe(
        bitmaskWithUpdate
      );
    });
  });

  describe("parseBitmask", () => {
    it("should parse bitmask to configuration", () => {
      expect(parseBitmask(bitmask0)).toEqual({
        group: TestPermissionGroup.USER,
        read: false,
        create: false,
        delete: false,
        update: false
      });
      expect(parseBitmask(bitmask1)).toEqual({
        group: TestPermissionGroup.POST,
        read: true,
        create: true,
        delete: true,
        update: true
      });
      expect(parseBitmask(bitmask2)).toEqual({
        group: TestPermissionGroup.COMMENT,
        read: true,
        create: false,
        delete: false,
        update: false
      });
      expect(parseBitmask(bitmask3)).toEqual({
        group: TestPermissionGroup.LIKE,
        read: true,
        create: true,
        delete: true,
        update: true
      });
      expect(parseBitmask(bitmaskWithUpdate)).toEqual({
        group: TestPermissionGroup.POST,
        read: true,
        create: false,
        delete: false,
        update: true
      });
    });
  });

  describe("getPermissionGroup", () => {
    it("should return correct group from bitmask", () => {
      expect(getPermissionGroup(bitmask0)).toBe(TestPermissionGroup.USER);
      expect(getPermissionGroup(bitmask1)).toBe(TestPermissionGroup.POST);
      expect(getPermissionGroup(bitmask2)).toBe(TestPermissionGroup.COMMENT);
      expect(getPermissionGroup(bitmask3)).toBe(TestPermissionGroup.LIKE);
      expect(getPermissionGroup(bitmaskWithUpdate)).toBe(TestPermissionGroup.POST);
    });
  });

  describe("hasPermissionAccess", () => {
    it("should correctly check access presence", () => {
      expect(hasPermissionAccess(bitmask0, PermissionAccess.READ)).toBe(false);
      expect(hasPermissionAccess(bitmask1, PermissionAccess.CREATE)).toBe(true);
      expect(hasPermissionAccess(bitmask2, PermissionAccess.DELETE)).toBe(false);
      expect(hasPermissionAccess(bitmask3, PermissionAccess.READ)).toBe(true);
      expect(hasPermissionAccess(bitmaskWithUpdate, PermissionAccess.UPDATE)).toBe(true);
      expect(hasPermissionAccess(bitmaskWithUpdate, PermissionAccess.CREATE)).toBe(false);
    });
  });

  describe("hasPermissionGroup", () => {
    it("should correctly check group presence", () => {
      expect(hasPermissionGroup(bitmask0, TestPermissionGroup.USER)).toBe(true);
      expect(hasPermissionGroup(bitmask2, TestPermissionGroup.COMMENT)).toBe(true);
      expect(hasPermissionGroup(bitmask1, TestPermissionGroup.LIKE)).toBe(false);
      expect(hasPermissionGroup(bitmaskWithUpdate, TestPermissionGroup.POST)).toBe(true);
    });
  });

  describe("getPermissionAccess", () => {
    it("should return correct access flags from bitmask", () => {
      expect(getPermissionAccess(bitmask0)).toBe(0b0000);
      expect(getPermissionAccess(bitmask1)).toBe(0b1111);
      expect(getPermissionAccess(bitmask2)).toBe(0b0001);
      expect(getPermissionAccess(bitmask3)).toBe(0b1111);
      expect(getPermissionAccess(bitmaskWithUpdate)).toBe(0b0101);
    });
  });

  describe("access checking utilities", () => {
    it("should verify read access", () => {
      expect(canRead(bitmask2)).toBe(true);
      expect(canRead(bitmask0)).toBe(false);
    });

    it("should verify create access", () => {
      expect(canCreate(bitmask1)).toBe(true);
      expect(canCreate(bitmask2)).toBe(false);
      expect(canCreate(bitmaskWithUpdate)).toBe(false);
    });

    it("should verify create access", () => {
    expect(canCreate(bitmask1)).toBe(true);
    expect(canCreate(bitmask2)).toBe(false);
    expect(canCreate(bitmaskWithUpdate)).toBe(false);
    });

    it("should verify delete access", () => {
      expect(canDelete(bitmask1)).toBe(true);
      expect(canDelete(bitmask0)).toBe(false);
      expect(canDelete(bitmaskWithUpdate)).toBe(false);
    });

    it("should verify update access", () => {
      expect(canUpdate(bitmask1)).toBe(true);
      expect(canUpdate(bitmask2)).toBe(false);
      expect(canUpdate(bitmaskWithUpdate)).toBe(true);
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
      const updated = setPermissionAccess(bitmask0, 0b1111); // Full access
      expect(canRead(updated)).toBe(true);
      expect(canCreate(updated)).toBe(true);
      expect(canDelete(updated)).toBe(true);
      expect(canUpdate(updated)).toBe(true);
    });
  });

  describe("hasRequiredPermission", () => {
    it("should return true if one of the bitmasks contains the required group and access", () => {
      const bitmasks = [bitmask0, bitmask1];
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.POST, PermissionAccess.CREATE)).toBe(true);
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.POST, PermissionAccess.UPDATE)).toBe(true);
    });

    it("should return false if no bitmask contains the required group and access", () => {
      const bitmasks = [bitmask0, bitmask2];
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.POST, PermissionAccess.CREATE)).toBe(false);
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.POST, PermissionAccess.UPDATE)).toBe(false);
    });

    it("should handle empty bitmask array", () => {
      const bitmasks: number[] = [];
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.POST, PermissionAccess.CREATE)).toBe(false);
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.POST, PermissionAccess.UPDATE)).toBe(false);
    });
  });

  describe("getPermissionBitmask", () => {
    it("should create a bitmask from group and access", () => {
      expect(getPermissionBitmask(TestPermissionGroup.COMMENT, PermissionAccessBitmasks.READ)).toBe(bitmask2);
      expect(getPermissionBitmask(TestPermissionGroup.LIKE, PermissionAccessBitmasks.FULL)).toBe(bitmask3);
      expect(getPermissionBitmask(TestPermissionGroup.USER, 0b0000)).toBe(bitmask0);
    });
  });
});
