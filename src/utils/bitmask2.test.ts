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
} from "..";
import { PermissionAccess, PermissionAccessBitmasks } from "../constants/permission";

// Generate 100 permission groups
const TestPermissionGroup = Object.fromEntries(
  Array.from({ length: 100 }, (_, i) => [`GROUP_${i}`, i])
) as Record<string, number>;

// 5 different bitmask examples
const bitmask0 = createBitmask({ group: TestPermissionGroup.GROUP_0, read: false, write: false, delete: false }); // No permissions
const bitmask1 = createBitmask({ group: TestPermissionGroup.GROUP_10, read: true, write: false, delete: false }); // Read only
const bitmask2 = createBitmask({ group: TestPermissionGroup.GROUP_25, read: true, write: true, delete: false }); // Read, Write
const bitmask3 = createBitmask({ group: TestPermissionGroup.GROUP_50, read: true, write: true, delete: true }); // Full access
const bitmask4 = createBitmask({ group: TestPermissionGroup.GROUP_99, read: false, write: true, delete: true }); // Write, Delete

describe("Permission Bitmask Utilities", () => {
  describe("TestPermissionGroup", () => {
    it("should have 100 permission groups", () => {
      expect(Object.keys(TestPermissionGroup).length).toBe(100);
      expect(TestPermissionGroup.GROUP_0).toBe(0);
      expect(TestPermissionGroup.GROUP_99).toBe(99);
    });
  });

  describe("createBitmask", () => {
    it("should create correct bitmask with no permissions", () => {
      const result = createBitmask({ group: TestPermissionGroup.GROUP_0, read: false, write: false, delete: false });
      expect(getPermissionGroup(result)).toBe(TestPermissionGroup.GROUP_0);
      expect(canRead(result)).toBe(false);
      expect(canWrite(result)).toBe(false);
      expect(canDelete(result)).toBe(false);
    });

    it("should create correct bitmask with read-only permission", () => {
      const result = createBitmask({ group: TestPermissionGroup.GROUP_10, read: true, write: false, delete: false });
      expect(getPermissionGroup(result)).toBe(TestPermissionGroup.GROUP_10);
      expect(canRead(result)).toBe(true);
      expect(canWrite(result)).toBe(false);
      expect(canDelete(result)).toBe(false);
    });

    it("should create correct bitmask with read-write permissions", () => {
      const result = createBitmask({ group: TestPermissionGroup.GROUP_25, read: true, write: true, delete: false });
      expect(getPermissionGroup(result)).toBe(TestPermissionGroup.GROUP_25);
      expect(canRead(result)).toBe(true);
      expect(canWrite(result)).toBe(true);
      expect(canDelete(result)).toBe(false);
    });

    it("should create correct bitmask with full permissions", () => {
      const result = createBitmask({ group: TestPermissionGroup.GROUP_50, read: true, write: true, delete: true });
      expect(getPermissionGroup(result)).toBe(TestPermissionGroup.GROUP_50);
      expect(canRead(result)).toBe(true);
      expect(canWrite(result)).toBe(true);
      expect(canDelete(result)).toBe(true);
    });

    it("should create correct bitmask with write-delete permissions", () => {
      const result = createBitmask({ group: TestPermissionGroup.GROUP_99, read: false, write: true, delete: true });
      expect(getPermissionGroup(result)).toBe(TestPermissionGroup.GROUP_99);
      expect(canRead(result)).toBe(false);
      expect(canWrite(result)).toBe(true);
      expect(canDelete(result)).toBe(true);
    });
  });

  describe("parseBitmask", () => {
    it("should parse bitmasks to configuration correctly", () => {
      expect(parseBitmask(bitmask0)).toEqual({
        group: TestPermissionGroup.GROUP_0,
        read: false,
        write: false,
        delete: false
      });
      
      expect(parseBitmask(bitmask1)).toEqual({
        group: TestPermissionGroup.GROUP_10,
        read: true,
        write: false,
        delete: false
      });
      
      expect(parseBitmask(bitmask2)).toEqual({
        group: TestPermissionGroup.GROUP_25,
        read: true,
        write: true,
        delete: false
      });
      
      expect(parseBitmask(bitmask3)).toEqual({
        group: TestPermissionGroup.GROUP_50,
        read: true,
        write: true,
        delete: true
      });
      
      expect(parseBitmask(bitmask4)).toEqual({
        group: TestPermissionGroup.GROUP_99,
        read: false,
        write: true,
        delete: true
      });
    });
  });

  describe("getPermissionGroup", () => {
    it("should return correct group from bitmasks with various group values", () => {
      expect(getPermissionGroup(bitmask0)).toBe(TestPermissionGroup.GROUP_0);
      expect(getPermissionGroup(bitmask1)).toBe(TestPermissionGroup.GROUP_10);
      expect(getPermissionGroup(bitmask2)).toBe(TestPermissionGroup.GROUP_25);
      expect(getPermissionGroup(bitmask3)).toBe(TestPermissionGroup.GROUP_50);
      expect(getPermissionGroup(bitmask4)).toBe(TestPermissionGroup.GROUP_99);
      
      // Test some additional group values
      for (let i = 5; i < 100; i += 15) {
        const testBitmask = createBitmask({ group: i, read: true });
        expect(getPermissionGroup(testBitmask)).toBe(i);
      }
    });
  });

  describe("hasPermissionAccess", () => {
    it("should correctly check access presence in various bitmasks", () => {
      // No permissions
      expect(hasPermissionAccess(bitmask0, PermissionAccess.READ)).toBe(false);
      expect(hasPermissionAccess(bitmask0, PermissionAccess.WRITE)).toBe(false);
      expect(hasPermissionAccess(bitmask0, PermissionAccess.DELETE)).toBe(false);
      
      // Read only
      expect(hasPermissionAccess(bitmask1, PermissionAccess.READ)).toBe(true);
      expect(hasPermissionAccess(bitmask1, PermissionAccess.WRITE)).toBe(false);
      
      // Read-write
      expect(hasPermissionAccess(bitmask2, PermissionAccess.READ)).toBe(true);
      expect(hasPermissionAccess(bitmask2, PermissionAccess.WRITE)).toBe(true);
      expect(hasPermissionAccess(bitmask2, PermissionAccess.DELETE)).toBe(false);
      
      // Full access
      expect(hasPermissionAccess(bitmask3, PermissionAccess.READ)).toBe(true);
      expect(hasPermissionAccess(bitmask3, PermissionAccess.WRITE)). toBe(true);
      expect(hasPermissionAccess(bitmask3, PermissionAccess.DELETE)).toBe(true);
      
      // Write-delete
      expect(hasPermissionAccess(bitmask4, PermissionAccess.READ)).toBe(false);
      expect(hasPermissionAccess(bitmask4, PermissionAccess.WRITE)).toBe(true);
      expect(hasPermissionAccess(bitmask4, PermissionAccess.DELETE)).toBe(true);
    });
  });

  describe("hasPermissionGroup", () => {
    it("should correctly check group presence in various bitmasks", () => {
      expect(hasPermissionGroup(bitmask0, TestPermissionGroup.GROUP_0)).toBe(true);
      expect(hasPermissionGroup(bitmask1, TestPermissionGroup.GROUP_10)).toBe(true);
      expect(hasPermissionGroup(bitmask2, TestPermissionGroup.GROUP_25)).toBe(true);
      expect(hasPermissionGroup(bitmask3, TestPermissionGroup.GROUP_50)).toBe(true);
      expect(hasPermissionGroup(bitmask4, TestPermissionGroup.GROUP_99)).toBe(true);
      
      // Negative checks
      expect(hasPermissionGroup(bitmask0, TestPermissionGroup.GROUP_1)).toBe(false);
      expect(hasPermissionGroup(bitmask1, TestPermissionGroup.GROUP_11)).toBe(false);
      expect(hasPermissionGroup(bitmask2, TestPermissionGroup.GROUP_26)).toBe(false);
      expect(hasPermissionGroup(bitmask3, TestPermissionGroup.GROUP_51)).toBe(false);
      expect(hasPermissionGroup(bitmask4, TestPermissionGroup.GROUP_98)).toBe(false);
    });
  });

  describe("getPermissionAccess", () => {
    it("should return correct access flags from various bitmasks", () => {
      expect(getPermissionAccess(bitmask0)).toBe(0); // No permissions
      expect(getPermissionAccess(bitmask1)).toBe(PermissionAccess.READ); // Read only
      expect(getPermissionAccess(bitmask2)).toBe(PermissionAccess.READ | PermissionAccess.WRITE); // Read + Write
      expect(getPermissionAccess(bitmask3)).toBe(PermissionAccessBitmasks.FULL); // Full access
      expect(getPermissionAccess(bitmask4)).toBe(PermissionAccess.WRITE | PermissionAccess.DELETE); // Write + Delete
    });
  });

  describe("access checking utilities", () => {
    it("should verify read access correctly for multiple bitmasks", () => {
      expect(canRead(bitmask0)).toBe(false);
      expect(canRead(bitmask1)).toBe(true);
      expect(canRead(bitmask2)).toBe(true);
      expect(canRead(bitmask3)).toBe(true);
      expect(canRead(bitmask4)).toBe(false);
    });

    it("should verify write access correctly for multiple bitmasks", () => {
      expect(canWrite(bitmask0)).toBe(false);
      expect(canWrite(bitmask1)).toBe(false);
      expect(canWrite(bitmask2)).toBe(true);
      expect(canWrite(bitmask3)).toBe(true);
      expect(canWrite(bitmask4)).toBe(true);
    });

    it("should verify delete access correctly for multiple bitmasks", () => {
      expect(canDelete(bitmask0)).toBe(false);
      expect(canDelete(bitmask1)).toBe(false);
      expect(canDelete(bitmask2)).toBe(false);
      expect(canDelete(bitmask3)).toBe(true);
      expect(canDelete(bitmask4)).toBe(true);
    });
  });

  describe("setPermissionGroup", () => {
    it("should update group in bitmask while preserving access", () => {
      // Test changing from group 10 (read only) to group 75
      const updated1 = setPermissionGroup(bitmask1, TestPermissionGroup.GROUP_75);
      expect(getPermissionGroup(updated1)).toBe(TestPermissionGroup.GROUP_75);
      expect(canRead(updated1)).toBe(true);
      expect(canWrite(updated1)).toBe(false);
      expect(canDelete(updated1)).toBe(false);
      
      // Test changing from group 25 (read-write) to group 87
      const updated2 = setPermissionGroup(bitmask2, TestPermissionGroup.GROUP_87);
      expect(getPermissionGroup(updated2)).toBe(TestPermissionGroup.GROUP_87);
      expect(canRead(updated2)).toBe(true);
      expect(canWrite(updated2)).toBe(true);
      expect(canDelete(updated2)).toBe(false);
      
      // Test changing from group 50 (full access) to group 3
      const updated3 = setPermissionGroup(bitmask3, TestPermissionGroup.GROUP_3);
      expect(getPermissionGroup(updated3)).toBe(TestPermissionGroup.GROUP_3);
      expect(canRead(updated3)).toBe(true);
      expect(canWrite(updated3)).toBe(true);
      expect(canDelete(updated3)).toBe(true);
    });
  });

  describe("setPermissionAccess", () => {
    it("should update access in bitmask while preserving group", () => {
      // Change from no permissions to full permissions
      const updated1 = setPermissionAccess(bitmask0, PermissionAccessBitmasks.FULL);
      expect(getPermissionGroup(updated1)).toBe(TestPermissionGroup.GROUP_0);
      expect(canRead(updated1)).toBe(true);
      expect(canWrite(updated1)).toBe(true);
      expect(canDelete(updated1)).toBe(true);
      
      // Change from read-only to read-write
      const updated2 = setPermissionAccess(bitmask1, PermissionAccessBitmasks.WRITE);
      expect(getPermissionGroup(updated2)).toBe(TestPermissionGroup.GROUP_10);
      expect(canRead(updated2)).toBe(true);
      expect(canWrite(updated2)).toBe(true);
      expect(canDelete(updated2)).toBe(false);
      
      // Change from read-write to read-only
      const updated3 = setPermissionAccess(bitmask2, PermissionAccessBitmasks.READ);
      expect(getPermissionGroup(updated3)).toBe(TestPermissionGroup.GROUP_25);
      expect(canRead(updated3)).toBe(true);
      expect(canWrite(updated3)).toBe(false);
      expect(canDelete(updated3)).toBe(false);
    });
  });

  describe("hasRequiredPermission", () => {
    it("should return true if one of the bitmasks contains the required group and access", () => {
      const bitmasks = [bitmask0, bitmask1, bitmask2, bitmask3, bitmask4];
      
      // GROUP_10 has READ access in the array
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.GROUP_10, PermissionAccess.READ)).toBe(true);
      
      // GROUP_50 has full access in the array
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.GROUP_50, PermissionAccess.READ)).toBe(true);
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.GROUP_50, PermissionAccess.WRITE)).toBe(true);
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.GROUP_50, PermissionAccess.DELETE)).toBe(true);
      
      // GROUP_99 doesn't have READ access in the array
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.GROUP_99, PermissionAccess.READ)).toBe(false);
      
      // GROUP_25 doesn't have DELETE access in the array
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.GROUP_25, PermissionAccess.DELETE)).toBe(false);
    });

    it("should return false if no bitmask contains the required group and access", () => {
      const bitmasks = [bitmask0, bitmask1, bitmask2, bitmask3, bitmask4];
      
      // GROUP_5 is not in any bitmask
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.GROUP_5, PermissionAccess.READ)).toBe(false);
      
      // GROUP_0 exists but has no permissions
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.GROUP_0, PermissionAccess.READ)).toBe(false);
    });

    it("should handle empty bitmask array", () => {
      const bitmasks: number[] = [];
      expect(hasRequiredPermission(bitmasks, TestPermissionGroup.GROUP_10, PermissionAccess.READ)).toBe(false);
    });
  });

  describe("getPermissionBitmask", () => {
    it("should create a bitmask from group and access correctly", () => {
      // Test creating bitmask for various group and access combinations
      const testCases = [
        { group: TestPermissionGroup.GROUP_15, access: PermissionAccessBitmasks.READ },
        { group: TestPermissionGroup.GROUP_30, access: PermissionAccessBitmasks.WRITE },
        { group: TestPermissionGroup.GROUP_45, access: PermissionAccessBitmasks.FULL },
        { group: TestPermissionGroup.GROUP_60, access: PermissionAccess.READ | PermissionAccess.DELETE },
        { group: TestPermissionGroup.GROUP_75, access: PermissionAccess.WRITE | PermissionAccess.DELETE }
      ];
      
      for (const { group, access } of testCases) {
        const bitmask = getPermissionBitmask(group, access);
        expect(getPermissionGroup(bitmask)).toBe(group);
        expect(getPermissionAccess(bitmask)).toBe(access);
      }
    });
  });
});
