import { describe, it, expect, beforeEach } from 'vitest';
import { ALL_PERMISSIONS, Permask } from '../src/permask-class';

describe('Permask', () => {
  // Default permissions instance for basic tests
  let defaultPermask: Permask<{
    READ: number;
    WRITE: number;
    DELETE: number;
  }>;
  
  // Custom permissions for advanced tests
  let customPermask: Permask<{
    VIEW: number;
    EDIT: number;
    DELETE: number;
    SHARE: number;
    PRINT: number;
    ARCHIVE?: number;
  }>;
  
  beforeEach(() => {
    // Create a default instance
    defaultPermask = new Permask();
    
    // Create a custom instance with more bits
    customPermask = new Permask({
      permissions: {
        VIEW: 1,      // 0b00001
        EDIT: 2,      // 0b00010
        DELETE: 4,    // 0b00100
        SHARE: 8,     // 0b01000
        PRINT: 16,    // 0b10000
      } as const,
      accessBits: 6,  // Changed from 5 to 6 to accommodate values up to 63
      groups: {
        DOCUMENTS: 1,
        PHOTOS: 2,
        VIDEOS: 3
      }
    });
  });
  
  describe('Initialization', () => {
    it('should initialize with default values', () => {
      expect(defaultPermask).toBeDefined();
      
      // Create a permission to verify defaults are working
      const permission = defaultPermask.createStandardBitmask({
        group: 1,
        read: true
      });
      
      expect(defaultPermask.canRead(permission)).toBe(true);
      expect(defaultPermask.canWrite(permission)).toBe(false);
      expect(defaultPermask.getGroup(permission)).toBe(1);
    });
    
    it('should initialize with custom permissions', () => {
      expect(customPermask).toBeDefined();
      
      // Create a custom permission
      const permission = customPermask.create('DOCUMENTS', ['VIEW', 'EDIT']);
      
      // Verify custom permissions work
      expect(customPermask.hasPermission(permission, 'VIEW')).toBe(true);
      expect(customPermask.hasPermission(permission, 'EDIT')).toBe(true);
      expect(customPermask.hasPermission(permission, 'DELETE')).toBe(false);
    });
    
    it('should throw error for permission values exceeding bit capacity', () => {
      expect(() => new Permask({
        permissions: { INVALID: 16 },
        accessBits: 3  // Only allows values up to 7
      })).toThrow(/exceeds the maximum value/);
    });
  });
  
  describe('Permission Operations', () => {
    it('should create permissions with the correct bitmask', () => {
      // Create a permission for documents that allows view and edit
      const permission = customPermask.create('DOCUMENTS', ['VIEW', 'EDIT']);
      
      // VIEW (1) + EDIT (2) = 3
      // GROUP (1) << 6 = 64 (updated for 6 bits)
      // Expected: 64 | 3 = 67
      expect(permission).toBe(67);
      
      // Parse and verify components
      const parsed = customPermask.parse(permission);
      expect(parsed.group).toBe(1);
      expect(parsed.groupName).toBe('DOCUMENTS');
      expect(parsed.permissions.VIEW).toBe(true);
      expect(parsed.permissions.EDIT).toBe(true);
      expect(parsed.permissions.DELETE).toBe(false);
    });
    
    it('should add permissions correctly', () => {
      // Create a base permission
      const base = customPermask.create('DOCUMENTS', ['VIEW']);
      
      // Add EDIT permission
      const withEdit = customPermask.addPermission(base, 'EDIT');
      
      expect(customPermask.hasPermission(withEdit, 'VIEW')).toBe(true);
      expect(customPermask.hasPermission(withEdit, 'EDIT')).toBe(true);
      expect(customPermask.getGroup(withEdit)).toBe(1); // Group should be unchanged
    });
    
    it('should remove permissions correctly', () => {
      // Create a permission with multiple accesses
      const fullAccess = customPermask.create('DOCUMENTS', ['VIEW', 'EDIT', 'DELETE']);
      
      // Remove the EDIT permission
      const reducedAccess = customPermask.removePermission(fullAccess, 'EDIT');
      
      expect(customPermask.hasPermission(reducedAccess, 'VIEW')).toBe(true);
      expect(customPermask.hasPermission(reducedAccess, 'EDIT')).toBe(false);
      expect(customPermask.hasPermission(reducedAccess, 'DELETE')).toBe(true);
    });
    
    it('should check permissions correctly', () => {
      const permission = customPermask.create('PHOTOS', ['VIEW', 'SHARE']);
      
      expect(customPermask.hasPermission(permission, 'VIEW')).toBe(true);
      expect(customPermask.hasPermission(permission, 'SHARE')).toBe(true);
      expect(customPermask.hasPermission(permission, 'EDIT')).toBe(false);
      expect(customPermask.hasPermission(permission, 'DELETE')).toBe(false);
      expect(customPermask.hasPermission(permission, 'PRINT')).toBe(false);
    });
  });
  
  describe('Group Operations', () => {
    it('should get group value correctly', () => {
      const permission = customPermask.create('VIDEOS', ['VIEW']);
      expect(customPermask.getGroup(permission)).toBe(3);
    });
    
    it('should get group name correctly', () => {
      const permission = customPermask.create('PHOTOS', ['VIEW']);
      expect(customPermask.getGroupName(permission)).toBe('PHOTOS');
    });
    
    it('should check group membership correctly', () => {
      const permission = customPermask.create('DOCUMENTS', ['VIEW']);
      
      expect(customPermask.hasGroup(permission, 'DOCUMENTS')).toBe(true);
      expect(customPermask.hasGroup(permission, 'PHOTOS')).toBe(false);
      expect(customPermask.hasGroup(permission, 1)).toBe(true);
      expect(customPermask.hasGroup(permission, 2)).toBe(false);
    });
    
    it('should handle unknown group names gracefully', () => {
      const permission = customPermask.create(999, ['VIEW']);
      expect(customPermask.getGroupName(permission)).toBeUndefined();
      
      // Creating with non-existent string group should use group 0
      const noGroup = customPermask.create('NON_EXISTENT', ['VIEW']);
      expect(customPermask.getGroup(noGroup)).toBe(0);
    });
  });
  
  describe('Standard Bitmask Compatibility', () => {
    it('should create standard bitmasks correctly', () => {
      const permission = defaultPermask.createStandardBitmask({
        group: 5,
        read: true,
        write: true,
        delete: false
      });
      
      expect(defaultPermask.canRead(permission)).toBe(true);
      expect(defaultPermask.canWrite(permission)).toBe(true);
      expect(defaultPermask.canDelete(permission)).toBe(false);
      expect(defaultPermask.getGroup(permission)).toBe(5);
    });
    
    it('should work with named groups', () => {
      customPermask.registerGroup('SPREADSHEETS', 10);
      
      const permission = customPermask.createStandardBitmask({
        group: 'SPREADSHEETS',
        read: true,
        write: true,
        delete: false,
        customPermissions: ['SHARE']
      });
      
      expect(customPermask.getGroup(permission)).toBe(10);
      expect(customPermask.canRead(permission)).toBe(true);
      expect(customPermask.canWrite(permission)).toBe(true);
      expect(customPermask.hasPermission(permission, 'SHARE')).toBe(true);
    });
  });
  
  describe('Dynamic Registration', () => {
    it('should register new permissions at runtime', () => {
      // Register a new permission - changed from 32 to 32 which fits in 6 bits
      customPermask.registerPermission('ARCHIVE', 32);
      
      // Create permission using the new type
      const permission = customPermask.create('DOCUMENTS', ['VIEW', 'ARCHIVE']);
      
      expect(customPermask.hasPermission(permission, 'ARCHIVE')).toBe(true);
      expect(customPermask.parse(permission).permissions['ARCHIVE']).toBe(true);
    });
    
    it('should throw error when registering permissions that exceed bit capacity', () => {
      // Should test with a value that definitely exceeds the capacity (now 6 bits = max 63)
      expect(() => customPermask.registerPermission('OVERFLOW', 64)).toThrow(/exceeds the maximum value/);
    });
    
    it('should register new groups at runtime', () => {
      // Register a new group
      customPermask.registerGroup('ARCHIVES', 20);
      
      // Create permission for the new group
      const permission = customPermask.create('ARCHIVES', ['VIEW']);
      
      expect(customPermask.getGroup(permission)).toBe(20);
      expect(customPermask.getGroupName(permission)).toBe('ARCHIVES');
    });
  });
  
  describe('Parse Functionality', () => {
    it('should parse bitmasks to detailed objects', () => {
      const permission = customPermask.create('VIDEOS', ['VIEW', 'EDIT', 'SHARE']);
      
      const parsed = customPermask.parse(permission);
      
      expect(parsed).toEqual({
        group: 3,
        groupName: 'VIDEOS',
        permissions: {
          VIEW: true,
          EDIT: true,
          DELETE: false,
          SHARE: true,
          PRINT: false
        }
      });
    });
    
    it('should handle parsing bitmasks with unknown groups', () => {
      // Create a permission with a group that doesn't have a name
      const permission = customPermask.create(42, ['VIEW']);
      
      const parsed = customPermask.parse(permission);
      
      expect(parsed.group).toBe(42);
      expect(parsed.groupName).toBeUndefined();
      expect(parsed.permissions.VIEW).toBe(true);
    });
  });
  
  describe('Advanced Features', () => {
    it('should handle custom access mask', () => {
      // Create a completely separate instance with its own configuration
      // to avoid interference with other tests
      const customMaskPermask = new Permask({
        permissions: { TEST: 1, TEST2: 2 }, // Start with minimal permissions
        accessBits: 4,
        accessMask: 0b1111  // Explicitly set mask
      });
      
      // Register a permission that's at the limit
      expect(() => customMaskPermask.registerPermission('MAX', 15)).not.toThrow();
      // Register a permission that exceeds the limit
      expect(() => customMaskPermask.registerPermission('OVER', 16)).toThrow(/exceeds the maximum value/);
    });
    
    it('should handle the default values correctly', () => {
      const permission = defaultPermask.createStandardBitmask({
        group: 1,
        read: true
      });
      
      // Instead of assuming specific values, check the functional behavior
      expect(defaultPermask.canRead(permission)).toBe(true);
      expect(defaultPermask.canWrite(permission)).toBe(false);
      expect(defaultPermask.getGroup(permission)).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    // Create a separate instance for edge case tests to avoid interference
    let edgeCasePermask: Permask<{
      VIEW: number;
      [key: string]: number;
    }>;
    
    beforeEach(() => {
      edgeCasePermask = new Permask({
        permissions: {
          VIEW: 1
        },
        accessBits: 4, // Use a higher bit count for these tests
        groups: {
          DOCUMENTS: 1
        }
      });
    });

    it('should handle group 0 correctly', () => {
      const permission = edgeCasePermask.create(0, ['VIEW']);
      expect(edgeCasePermask.getGroup(permission)).toBe(0);
    });
    
    it('should handle permission value 0 correctly', () => {
      edgeCasePermask.registerPermission('NO_ACCESS', 0);
      
      const permission = edgeCasePermask.create('DOCUMENTS', ['NO_ACCESS']);
      
      // Creating with no actual permission bits results in 0 access
      expect(edgeCasePermask.hasPermission(permission, 'VIEW')).toBe(false);
      expect(edgeCasePermask.hasPermission(permission, 'NO_ACCESS')).toBe(false); // 0 & anything = 0
    });
    
    it('should handle attempting to use undefined permissions', () => {
      const permission = edgeCasePermask.create('DOCUMENTS', ['VIEW']);
      
      // @ts-ignore - Intentionally testing with a non-existent permission
      expect(edgeCasePermask.hasPermission(permission, 'NON_EXISTENT')).toBe(false);
      
      // @ts-ignore - Intentionally testing with a non-existent permission
      const updatedPermission = edgeCasePermask.addPermission(permission, 'NON_EXISTENT');
      
      // The permission should be unchanged since NON_EXISTENT maps to value 0
      expect(edgeCasePermask.hasPermission(updatedPermission, 'VIEW')).toBe(true);
      expect(edgeCasePermask.getGroup(updatedPermission)).toBe(1);
    });
  });
  
  describe('Permission Helper Methods', () => {
    it('should return the full access value', () => {
      // For customPermask with 6 bits, the full value should be 63 (2^6 - 1)
      expect(customPermask.getFullAccessValue()).toBe(63);
      
      // For defaultPermask, it should match the standard ACCESS_MASK
      expect(defaultPermask.getFullAccessValue()).toBe(7); // 3 bits = 2^3 - 1 = 7
    });
    
    it('should combine permissions correctly', () => {
      // VIEW (1) + EDIT (2) = 3
      const combined = customPermask.combinePermissions(['VIEW', 'EDIT']);
      expect(combined).toBe(3);
      
      // Empty list should give 0
      expect(customPermask.combinePermissions([])).toBe(0);
      
      // All permissions combined should equal the full access mask
      const allPerms = customPermask.combinePermissions(['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT']);
      expect(allPerms).toBe(31); // 1+2+4+8+16 = 31
    });
    
    it('should display permission values correctly', () => {
      const values = customPermask.getPermissionValues();
      
      expect(values.VIEW.value).toBe(1);
      expect(values.VIEW.binaryValue).toBe('000001'); // 6-bit padding
      
      expect(values.EDIT.value).toBe(2);
      expect(values.EDIT.binaryValue).toBe('000010');
      
      expect(values.FULL_ACCESS.value).toBe(63);
      expect(values.FULL_ACCESS.binaryValue).toBe('111111');
    });
  });
  
  describe('All Permissions Methods', () => {
    it('should create a bitmask with all permissions', () => {
      const allPermissions = customPermask.createAllPermissions('DOCUMENTS');
      
      // Group 1 << 6 bits = 64, plus all permission bits (63)
      expect(allPermissions).toBe(127);
      
      // Should have all individual permissions
      expect(customPermask.hasPermission(allPermissions, 'VIEW')).toBe(true);
      expect(customPermask.hasPermission(allPermissions, 'EDIT')).toBe(true);
      expect(customPermask.hasPermission(allPermissions, 'DELETE')).toBe(true);
      expect(customPermask.hasPermission(allPermissions, 'SHARE')).toBe(true);
      expect(customPermask.hasPermission(allPermissions, 'PRINT')).toBe(true);
      
      // Should be identified as having all permissions
      expect(customPermask.hasAllPermissions(allPermissions)).toBe(true);
    });
    
    it('should add all permissions to existing bitmask', () => {
      const limited = customPermask.create('DOCUMENTS', ['VIEW']);
      const upgraded = customPermask.addAllPermissions(limited);
      
      expect(customPermask.hasAllPermissions(upgraded)).toBe(true);
      expect(customPermask.getGroup(upgraded)).toBe(1); // Group unchanged
    });
    
    it('should correctly identify partial permissions', () => {
      const partial = customPermask.create('DOCUMENTS', ['VIEW', 'EDIT']);
      
      expect(customPermask.hasAllPermissions(partial)).toBe(false);
      expect(customPermask.hasAnyPermission(partial)).toBe(true);
      
      // Empty permissions bitmask
      const empty = customPermask.create('DOCUMENTS', []);
      expect(customPermask.hasAnyPermission(empty)).toBe(false);
    });
  });

  describe('Simplified API', () => {
    it('should support ALL_PERMISSIONS symbol in create method', () => {
      // Create a permission with ALL_PERMISSIONS
      const fullAccess = customPermask.create('DOCUMENTS', [ALL_PERMISSIONS]);
      
      // Should have all permissions set
      expect(customPermask.hasPermission(fullAccess, 'VIEW')).toBe(true);
      expect(customPermask.hasPermission(fullAccess, 'EDIT')).toBe(true);
      expect(customPermask.hasPermission(fullAccess, 'DELETE')).toBe(true);
      expect(customPermask.hasPermission(fullAccess, 'SHARE')).toBe(true);
      expect(customPermask.hasPermission(fullAccess, 'PRINT')).toBe(true);
      expect(customPermask.hasAllPermissions(fullAccess)).toBe(true);
    });
    
    it('should provide predefined permission combinations', () => {
      expect(customPermask.FULL).toBe(63); // 2^6 - 1
      expect(customPermask.NONE).toBe(0);
      expect(customPermask.READ_ONLY).toBe(1); // Default READ value
      expect(customPermask.READ_WRITE).toBe(3); // READ(1) | WRITE(2) = 3
    });
    
    it('should create access with createAccess helper', () => {
      // Create full access
      const fullAccess = customPermask.createAccess('DOCUMENTS', 'full');
      expect(customPermask.hasAllPermissions(fullAccess)).toBe(true);
      expect(customPermask.getGroup(fullAccess)).toBe(1);
      
      // Create read-only access
      const readOnly = customPermask.createAccess('PHOTOS', 'read-only');
      expect(customPermask.canRead(readOnly)).toBe(true);
      expect(customPermask.canWrite(readOnly)).toBe(false);
      expect(customPermask.getGroup(readOnly)).toBe(2);
      
      // Create read-write access with custom permissions
      const custom = customPermask.createAccess('VIDEOS', 'read-write', ['SHARE']);
      expect(customPermask.canRead(custom)).toBe(true);
      expect(customPermask.canWrite(custom)).toBe(true);
      expect(customPermask.hasPermission(custom, 'SHARE')).toBe(true);
      expect(customPermask.hasPermission(custom, 'DELETE')).toBe(false);
      expect(customPermask.getGroup(custom)).toBe(3);
    });
    
    it('should use simplified grant method', () => {
      // Read-only access
      const readOnly = customPermask.grant({
        group: 'DOCUMENTS',
        read: true
      });
      expect(customPermask.canRead(readOnly)).toBe(true);
      expect(customPermask.canWrite(readOnly)).toBe(false);
      
      // Full access
      const fullAccess = customPermask.grant({
        group: 'PHOTOS',
        all: true
      });
      expect(customPermask.hasAllPermissions(fullAccess)).toBe(true);
      expect(customPermask.getGroup(fullAccess)).toBe(2);
      
      // Custom access
      const customAccess = customPermask.grant({
        group: 'VIDEOS',
        read: true,
        write: true,
        permissions: ['SHARE']
      });
      expect(customPermask.canRead(customAccess)).toBe(true);
      expect(customPermask.canWrite(customAccess)).toBe(true);
      expect(customPermask.hasPermission(customAccess, 'SHARE')).toBe(true);
    });
  });
});
