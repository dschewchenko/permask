import { describe, it, expect, beforeEach } from 'vitest';
import { Permark } from '../src/permask';
import { PermissionAccess } from '../src/constants/permission';
import { ACCESS_BITS, ACCESS_MASK } from '../src/constants/bitmask';

describe('Permark', () => {
  // Default permissions instance for basic tests
  let defaultPermark: Permark;
  
  // Custom permissions for advanced tests
  let customPermark: Permark<{
    VIEW: number;
    EDIT: number;
    DELETE: number;
    SHARE: number;
    PRINT: number;
    [key: string]: number;
  }>;
  
  beforeEach(() => {
    // Create a default instance
    defaultPermark = new Permark();
    
    // Create a custom instance with more bits
    customPermark = new Permark({
      permissions: {
        VIEW: 1,      // 0b00001
        EDIT: 2,      // 0b00010
        DELETE: 4,    // 0b00100
        SHARE: 8,     // 0b01000
        PRINT: 16     // 0b10000
      },
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
      expect(defaultPermark).toBeDefined();
      
      // Create a permission to verify defaults are working
      const permission = defaultPermark.createStandardBitmask({
        group: 1,
        read: true
      });
      
      expect(defaultPermark.canRead(permission)).toBe(true);
      expect(defaultPermark.canWrite(permission)).toBe(false);
      expect(defaultPermark.getGroup(permission)).toBe(1);
    });
    
    it('should initialize with custom permissions', () => {
      expect(customPermark).toBeDefined();
      
      // Create a custom permission
      const permission = customPermark.create('DOCUMENTS', ['VIEW', 'EDIT']);
      
      // Verify custom permissions work
      expect(customPermark.hasPermission(permission, 'VIEW')).toBe(true);
      expect(customPermark.hasPermission(permission, 'EDIT')).toBe(true);
      expect(customPermark.hasPermission(permission, 'DELETE')).toBe(false);
    });
    
    it('should throw error for permission values exceeding bit capacity', () => {
      expect(() => new Permark({
        permissions: { INVALID: 16 },
        accessBits: 3  // Only allows values up to 7
      })).toThrow(/exceeds the maximum value/);
    });
  });
  
  describe('Permission Operations', () => {
    it('should create permissions with the correct bitmask', () => {
      // Create a permission for documents that allows view and edit
      const permission = customPermark.create('DOCUMENTS', ['VIEW', 'EDIT']);
      
      // VIEW (1) + EDIT (2) = 3
      // GROUP (1) << 6 = 64 (updated for 6 bits)
      // Expected: 64 | 3 = 67
      expect(permission).toBe(67);
      
      // Parse and verify components
      const parsed = customPermark.parse(permission);
      expect(parsed.group).toBe(1);
      expect(parsed.groupName).toBe('DOCUMENTS');
      expect(parsed.permissions.VIEW).toBe(true);
      expect(parsed.permissions.EDIT).toBe(true);
      expect(parsed.permissions.DELETE).toBe(false);
    });
    
    it('should add permissions correctly', () => {
      // Create a base permission
      const base = customPermark.create('DOCUMENTS', ['VIEW']);
      
      // Add EDIT permission
      const withEdit = customPermark.addPermission(base, 'EDIT');
      
      expect(customPermark.hasPermission(withEdit, 'VIEW')).toBe(true);
      expect(customPermark.hasPermission(withEdit, 'EDIT')).toBe(true);
      expect(customPermark.getGroup(withEdit)).toBe(1); // Group should be unchanged
    });
    
    it('should remove permissions correctly', () => {
      // Create a permission with multiple accesses
      const fullAccess = customPermark.create('DOCUMENTS', ['VIEW', 'EDIT', 'DELETE']);
      
      // Remove the EDIT permission
      const reducedAccess = customPermark.removePermission(fullAccess, 'EDIT');
      
      expect(customPermark.hasPermission(reducedAccess, 'VIEW')).toBe(true);
      expect(customPermark.hasPermission(reducedAccess, 'EDIT')).toBe(false);
      expect(customPermark.hasPermission(reducedAccess, 'DELETE')).toBe(true);
    });
    
    it('should check permissions correctly', () => {
      const permission = customPermark.create('PHOTOS', ['VIEW', 'SHARE']);
      
      expect(customPermark.hasPermission(permission, 'VIEW')).toBe(true);
      expect(customPermark.hasPermission(permission, 'SHARE')).toBe(true);
      expect(customPermark.hasPermission(permission, 'EDIT')).toBe(false);
      expect(customPermark.hasPermission(permission, 'DELETE')).toBe(false);
      expect(customPermark.hasPermission(permission, 'PRINT')).toBe(false);
    });
  });
  
  describe('Group Operations', () => {
    it('should get group value correctly', () => {
      const permission = customPermark.create('VIDEOS', ['VIEW']);
      expect(customPermark.getGroup(permission)).toBe(3);
    });
    
    it('should get group name correctly', () => {
      const permission = customPermark.create('PHOTOS', ['VIEW']);
      expect(customPermark.getGroupName(permission)).toBe('PHOTOS');
    });
    
    it('should check group membership correctly', () => {
      const permission = customPermark.create('DOCUMENTS', ['VIEW']);
      
      expect(customPermark.hasGroup(permission, 'DOCUMENTS')).toBe(true);
      expect(customPermark.hasGroup(permission, 'PHOTOS')).toBe(false);
      expect(customPermark.hasGroup(permission, 1)).toBe(true);
      expect(customPermark.hasGroup(permission, 2)).toBe(false);
    });
    
    it('should handle unknown group names gracefully', () => {
      const permission = customPermark.create(999, ['VIEW']);
      expect(customPermark.getGroupName(permission)).toBeUndefined();
      
      // Creating with non-existent string group should use group 0
      const noGroup = customPermark.create('NON_EXISTENT', ['VIEW']);
      expect(customPermark.getGroup(noGroup)).toBe(0);
    });
  });
  
  describe('Standard Bitmask Compatibility', () => {
    it('should create standard bitmasks correctly', () => {
      const permission = defaultPermark.createStandardBitmask({
        group: 5,
        read: true,
        write: true,
        delete: false
      });
      
      expect(defaultPermark.canRead(permission)).toBe(true);
      expect(defaultPermark.canWrite(permission)).toBe(true);
      expect(defaultPermark.canDelete(permission)).toBe(false);
      expect(defaultPermark.getGroup(permission)).toBe(5);
    });
    
    it('should work with named groups', () => {
      customPermark.registerGroup('SPREADSHEETS', 10);
      
      const permission = customPermark.createStandardBitmask({
        group: 'SPREADSHEETS',
        read: true,
        write: true,
        delete: false,
        customPermissions: ['SHARE']
      });
      
      expect(customPermark.getGroup(permission)).toBe(10);
      expect(customPermark.canRead(permission)).toBe(true);
      expect(customPermark.canWrite(permission)).toBe(true);
      expect(customPermark.hasPermission(permission, 'SHARE')).toBe(true);
    });
  });
  
  describe('Dynamic Registration', () => {
    it('should register new permissions at runtime', () => {
      // Register a new permission - changed from 32 to 32 which fits in 6 bits
      customPermark.registerPermission('ARCHIVE', 32);
      
      // Create permission using the new type
      const permission = customPermark.create('DOCUMENTS', ['VIEW', 'ARCHIVE']);
      
      expect(customPermark.hasPermission(permission, 'ARCHIVE')).toBe(true);
      expect(customPermark.parse(permission).permissions['ARCHIVE']).toBe(true);
    });
    
    it('should throw error when registering permissions that exceed bit capacity', () => {
      // Should test with a value that definitely exceeds the capacity (now 6 bits = max 63)
      expect(() => customPermark.registerPermission('OVERFLOW', 64)).toThrow(/exceeds the maximum value/);
    });
    
    it('should register new groups at runtime', () => {
      // Register a new group
      customPermark.registerGroup('ARCHIVES', 20);
      
      // Create permission for the new group
      const permission = customPermark.create('ARCHIVES', ['VIEW']);
      
      expect(customPermark.getGroup(permission)).toBe(20);
      expect(customPermark.getGroupName(permission)).toBe('ARCHIVES');
    });
  });
  
  describe('Parse Functionality', () => {
    it('should parse bitmasks to detailed objects', () => {
      const permission = customPermark.create('VIDEOS', ['VIEW', 'EDIT', 'SHARE']);
      
      const parsed = customPermark.parse(permission);
      
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
      const permission = customPermark.create(42, ['VIEW']);
      
      const parsed = customPermark.parse(permission);
      
      expect(parsed.group).toBe(42);
      expect(parsed.groupName).toBeUndefined();
      expect(parsed.permissions.VIEW).toBe(true);
    });
  });
  
  describe('Advanced Features', () => {
    it('should handle custom access mask', () => {
      // Create a completely separate instance with its own configuration
      // to avoid interference with other tests
      const customMaskPermark = new Permark({
        permissions: { TEST: 1, TEST2: 2 }, // Start with minimal permissions
        accessBits: 4,
        accessMask: 0b1111  // Explicitly set mask
      });
      
      // Register a permission that's at the limit
      expect(() => customMaskPermark.registerPermission('MAX', 15)).not.toThrow();
      // Register a permission that exceeds the limit
      expect(() => customMaskPermark.registerPermission('OVER', 16)).toThrow(/exceeds the maximum value/);
    });
    
    it('should handle the default values correctly', () => {
      const permission = defaultPermark.createStandardBitmask({
        group: 1,
        read: true
      });
      
      // Instead of assuming specific values, check the functional behavior
      expect(defaultPermark.canRead(permission)).toBe(true);
      expect(defaultPermark.canWrite(permission)).toBe(false);
      expect(defaultPermark.getGroup(permission)).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    // Create a separate instance for edge case tests to avoid interference
    let edgeCasePermark: Permark<{
      VIEW: number;
      [key: string]: number;
    }>;
    
    beforeEach(() => {
      edgeCasePermark = new Permark({
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
      const permission = edgeCasePermark.create(0, ['VIEW']);
      expect(edgeCasePermark.getGroup(permission)).toBe(0);
    });
    
    it('should handle permission value 0 correctly', () => {
      edgeCasePermark.registerPermission('NO_ACCESS', 0);
      
      const permission = edgeCasePermark.create('DOCUMENTS', ['NO_ACCESS']);
      
      // Creating with no actual permission bits results in 0 access
      expect(edgeCasePermark.hasPermission(permission, 'VIEW')).toBe(false);
      expect(edgeCasePermark.hasPermission(permission, 'NO_ACCESS')).toBe(false); // 0 & anything = 0
    });
    
    it('should handle attempting to use undefined permissions', () => {
      const permission = edgeCasePermark.create('DOCUMENTS', ['VIEW']);
      
      // @ts-ignore - Intentionally testing with a non-existent permission
      expect(edgeCasePermark.hasPermission(permission, 'NON_EXISTENT')).toBe(false);
      
      // @ts-ignore - Intentionally testing with a non-existent permission
      const updatedPermission = edgeCasePermark.addPermission(permission, 'NON_EXISTENT');
      
      // The permission should be unchanged since NON_EXISTENT maps to value 0
      expect(edgeCasePermark.hasPermission(updatedPermission, 'VIEW')).toBe(true);
      expect(edgeCasePermark.getGroup(updatedPermission)).toBe(1);
    });
  });
});
