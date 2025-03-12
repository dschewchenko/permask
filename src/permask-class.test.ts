import { describe, it, expect, beforeEach } from 'vitest';
import { ALL_PERMISSIONS, Permask, PermaskBuilder } from '../src/permask-class';
import { PermissionAccess } from './constants/permission';

describe('Permask', () => {
  // Simple permissions for basic tests
  let basicPermask: Permask<{
    READ: number;
    WRITE: number;
    DELETE: number;
  }>;
  
  // Rich permissions for advanced tests
  let richPermask: Permask<{
    VIEW: number;
    EDIT: number;
    DELETE: number;
    SHARE: number;
    PRINT: number;
  }>;
  
  beforeEach(() => {
    // Set up basic permask using builder
    basicPermask = new PermaskBuilder<{
      READ: number;
      WRITE: number;
      DELETE: number;
    }>({
      permissions: {
        READ: PermissionAccess.READ,    // 1
        WRITE: PermissionAccess.WRITE,  // 2
        DELETE: PermissionAccess.DELETE // 4
      },
      accessBits: 3,
      groups: {
        USERS: 1,
        ADMINS: 2
      }
    }).build();
    
    // Set up rich permask using builder with more permissions and groups
    richPermask = new PermaskBuilder<{
      VIEW: number;
      EDIT: number;
      DELETE: number;
      SHARE: number;
      PRINT: number;
    }>({
      permissions: {
        VIEW: 1,    // 0b00001
        EDIT: 2,    // 0b00010
        DELETE: 4,  // 0b00100
        SHARE: 8,   // 0b01000
        PRINT: 16,  // 0b10000
      },
      accessBits: 6,
      groups: {
        DOCUMENTS: 1,
        PHOTOS: 2,
        VIDEOS: 3,
        SPREADSHEETS: 4
      }
    })
    .definePermissionSet('VIEWER', ['VIEW'])
    .definePermissionSet('EDITOR', ['VIEW', 'EDIT'])
    .definePermissionSet('MANAGER', ['VIEW', 'EDIT', 'DELETE'])
    .definePermissionSet('PUBLISHER', ['VIEW', 'SHARE'])
    .definePermissionSet('ADMIN', ['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT'])
    .build();
  });
  
  describe('Permission Creation', () => {
    it('should create basic permissions with correct bitmask values', () => {
      const readPermission = basicPermask.for('USERS').grant(['READ']).value();
      const readWritePermission = basicPermask.for('USERS').grant(['READ', 'WRITE']).value();
      
      // Group 1 (USERS) << 3 bits = 8, plus READ (1) = 9
      expect(readPermission).toBe(9);
      
      // Group 1 (USERS) << 3 bits = 8, plus READ (1) + WRITE (2) = 11
      expect(readWritePermission).toBe(11);
    });
    
    it('should create permissions with explicit group IDs', () => {
      const permission = richPermask.for(2).grant(['VIEW', 'EDIT']).value();
      
      // Group 2 (PHOTOS) << 6 bits = 128, plus VIEW (1) + EDIT (2) = 131
      expect(permission).toBe(131);
      expect(richPermask.check(permission).group()).toBe(2);
      expect(richPermask.check(permission).groupName()).toBe('PHOTOS');
    });
    
    it('should handle ALL_PERMISSIONS symbol', () => {
      const allPermissions = richPermask.for('DOCUMENTS').grant([ALL_PERMISSIONS]).value();
      const alternateWay = richPermask.for('DOCUMENTS').grantAll().value();
      
      // All permissions should set all bits (63 for 6 bits)
      expect(richPermask.check(allPermissions).canEverything()).toBe(true);
      expect(allPermissions).toBe(richPermask.check(allPermissions).group() << 6 | 63);
      expect(allPermissions).toEqual(alternateWay);
    });
    
    it('should handle permission sets', () => {
      const editorPerm = richPermask.for('DOCUMENTS').grantSet('EDITOR').value();
      const managerPerm = richPermask.for('PHOTOS').grantSet('MANAGER').value();
      
      // Editor has VIEW and EDIT
      expect(richPermask.check(editorPerm).can('VIEW')).toBe(true);
      expect(richPermask.check(editorPerm).can('EDIT')).toBe(true);
      expect(richPermask.check(editorPerm).can('DELETE')).toBe(false);
      
      // Manager has VIEW, EDIT, and DELETE
      expect(richPermask.check(managerPerm).can('VIEW')).toBe(true);
      expect(richPermask.check(managerPerm).can('EDIT')).toBe(true);
      expect(richPermask.check(managerPerm).can('DELETE')).toBe(true);
      expect(richPermask.check(managerPerm).can('SHARE')).toBe(false);
    });
    
    it('should combine permission sets and individual permissions', () => {
      // Grant editor set plus SHARE permission
      const customPerm = richPermask.for('VIDEOS')
        .grantSet('EDITOR')
        .grant(['SHARE'])
        .value();
      
      expect(richPermask.check(customPerm).can('VIEW')).toBe(true);
      expect(richPermask.check(customPerm).can('EDIT')).toBe(true);
      expect(richPermask.check(customPerm).can('SHARE')).toBe(true);
      expect(richPermask.check(customPerm).can('DELETE')).toBe(false);
      expect(richPermask.check(customPerm).can('PRINT')).toBe(false);
    });
  });
  
  describe('Permission Checking', () => {
    it('should check individual permissions', () => {
      const perm = richPermask.for('DOCUMENTS').grant(['VIEW', 'EDIT']).value();
      
      expect(richPermask.check(perm).can('VIEW')).toBe(true);
      expect(richPermask.check(perm).can('EDIT')).toBe(true);
      expect(richPermask.check(perm).can('DELETE')).toBe(false);
    });
    
    it('should check multiple permissions at once', () => {
      const perm = richPermask.for('DOCUMENTS').grant(['VIEW', 'EDIT', 'SHARE']).value();
      
      // All permissions check
      expect(richPermask.check(perm).canAll(['VIEW', 'EDIT'])).toBe(true);
      expect(richPermask.check(perm).canAll(['VIEW', 'DELETE'])).toBe(false);
      
      // Any permissions check
      expect(richPermask.check(perm).canAny(['DELETE', 'PRINT'])).toBe(false);
      expect(richPermask.check(perm).canAny(['EDIT', 'DELETE'])).toBe(true);
    });
    
    it('should check for complete permissions', () => {
      const partialPerm = richPermask.for('DOCUMENTS').grant(['VIEW', 'EDIT']).value();
      const allPerm = richPermask.for('DOCUMENTS').grantAll().value();
      
      expect(richPermask.check(partialPerm).canEverything()).toBe(false);
      expect(richPermask.check(allPerm).canEverything()).toBe(true);
    });
    
    it('should provide detailed permission explanation', () => {
      const perm = richPermask.for('PHOTOS').grant(['VIEW', 'SHARE']).value();
      
      const details = richPermask.check(perm).explain();
      
      expect(details).toEqual({
        group: 2,
        groupName: 'PHOTOS',
        permissions: {
          VIEW: true,
          EDIT: false,
          DELETE: false,
          SHARE: true,
          PRINT: false
        }
      });
    });
    
    it('should check group membership', () => {
      const perm = richPermask.for('DOCUMENTS').grant(['VIEW']).value();
      
      expect(richPermask.check(perm).inGroup('DOCUMENTS')).toBe(true);
      expect(richPermask.check(perm).inGroup('PHOTOS')).toBe(false);
      expect(richPermask.check(perm).inGroup(1)).toBe(true);
    });
  });
  
  describe('String Representation', () => {
    it('should convert permissions to strings', () => {
      const perm1 = richPermask.for('DOCUMENTS').grant(['VIEW', 'EDIT']).value();
      const perm2 = richPermask.for('PHOTOS').grantAll().value();
      const perm3 = richPermask.for('VIDEOS').grant([]).value();
      
      expect(richPermask.toString(perm1)).toBe('DOCUMENTS:VIEW,EDIT');
      expect(richPermask.toString(perm2)).toBe('PHOTOS:ALL');
      expect(richPermask.toString(perm3)).toBe('VIDEOS:NONE');
    });
    
    it('should parse permission strings', () => {
      const perm1 = richPermask.fromString('DOCUMENTS:VIEW,EDIT');
      const perm2 = richPermask.fromString('PHOTOS:ALL');
      const perm3 = richPermask.fromString('VIDEOS:MANAGER');
      const perm4 = richPermask.fromString('5:VIEW,SHARE'); // Numeric group
      
      expect(richPermask.check(perm1).canAll(['VIEW', 'EDIT'])).toBe(true);
      expect(richPermask.check(perm1).can('DELETE')).toBe(false);
      
      expect(richPermask.check(perm2).canEverything()).toBe(true);
      
      // Permission set expansion
      expect(richPermask.check(perm3).can('VIEW')).toBe(true);
      expect(richPermask.check(perm3).can('EDIT')).toBe(true);
      expect(richPermask.check(perm3).can('DELETE')).toBe(true);
      
      // Numeric group handling
      expect(richPermask.check(perm4).group()).toBe(5);
      expect(richPermask.check(perm4).canAll(['VIEW', 'SHARE'])).toBe(true);
    });
    
    it('should handle alternative string formats', () => {
      const permWithStar = richPermask.fromString('DOCUMENTS:*');
      const permWithEmpty = richPermask.fromString('VIDEOS:');
      
      expect(richPermask.check(permWithStar).canEverything()).toBe(true);
      expect(richPermask.check(permWithEmpty).canAny(['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT'])).toBe(false);
    });
  });
  
  describe('Builder Pattern', () => {
    it('should extend permissions with builder', () => {
      // Create extended version of the permissions system
      const extendedPermask = richPermask.toBuilder()
        .definePermission('APPROVE', 32)
        .defineGroup('REPORTS', 5)
        .definePermissionSet('APPROVER', ['VIEW', 'APPROVE'])
        .build();
      
      // Create permission using new components
      const reportPerm = extendedPermask.for('REPORTS').grantSet('APPROVER').value();
      
      expect(extendedPermask.check(reportPerm).can('VIEW')).toBe(true);
      expect(extendedPermask.check(reportPerm).can('APPROVE')).toBe(true);
      expect(extendedPermask.check(reportPerm).inGroup('REPORTS')).toBe(true);
    });
    
    it('should validate permission values', () => {
      // Try to add a permission that exceeds bit capacity (6 bits = max 63)
      expect(() => {
        richPermask.toBuilder()
          .definePermission('OVERFLOW', 64)
          .build();
      }).toThrow(/exceeds maximum value/);
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle group 0 correctly', () => {
      const perm = richPermask.for(0).grant(['VIEW']).value();
      
      expect(richPermask.check(perm).group()).toBe(0);
      expect(richPermask.check(perm).can('VIEW')).toBe(true);
    });
    
    it('should handle non-existent groups gracefully', () => {
      const perm = richPermask.for('NON_EXISTENT').grant(['VIEW']).value();
      
      expect(richPermask.check(perm).group()).toBe(0); // Default to group 0
      expect(richPermask.check(perm).can('VIEW')).toBe(true);
    });
    
    it('should handle non-existent permissions gracefully', () => {
      // @ts-ignore - Intentionally testing with a non-existent permission
      const perm = richPermask.for('DOCUMENTS').grant(['NON_EXISTENT']).value();
      
      expect(richPermask.check(perm).group()).toBe(1); // Group should be set
      expect(richPermask.check(perm).can('VIEW')).toBe(false); // No permissions granted
    });
    
    it('should handle empty permission lists', () => {
      const perm = richPermask.for('DOCUMENTS').grant([]).value();
      
      expect(richPermask.check(perm).group()).toBe(1);
      expect(richPermask.check(perm).can('VIEW')).toBe(false);
      expect(richPermask.check(perm).canAny(['VIEW', 'EDIT', 'DELETE', 'SHARE'])).toBe(false);
    });
  });
  
  describe('Permission Sets', () => {
    it('should use predefined permission sets', () => {
      const viewerPerm = richPermask.for('DOCUMENTS').grantSet('VIEWER').value();
      const editorPerm = richPermask.for('DOCUMENTS').grantSet('EDITOR').value();
      const managerPerm = richPermask.for('DOCUMENTS').grantSet('MANAGER').value();
      const adminPerm = richPermask.for('DOCUMENTS').grantSet('ADMIN').value();
      
      // Check viewer permissions
      expect(richPermask.check(viewerPerm).can('VIEW')).toBe(true);
      expect(richPermask.check(viewerPerm).can('EDIT')).toBe(false);
      
      // Check editor permissions
      expect(richPermask.check(editorPerm).canAll(['VIEW', 'EDIT'])).toBe(true);
      expect(richPermask.check(editorPerm).can('DELETE')).toBe(false);
      
      // Check manager permissions
      expect(richPermask.check(managerPerm).canAll(['VIEW', 'EDIT', 'DELETE'])).toBe(true);
      expect(richPermask.check(managerPerm).can('SHARE')).toBe(false);
      
      // Check admin permissions
      expect(richPermask.check(adminPerm).canAll(['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT'])).toBe(true);
    });
    
    it('should combine sets with additional permissions', () => {
      // Grant manager set plus SHARE permission
      const customPerm = richPermask.for('DOCUMENTS')
        .grantSet('MANAGER')
        .grant(['SHARE'])
        .value();
      
      expect(richPermask.check(customPerm).canAll(['VIEW', 'EDIT', 'DELETE', 'SHARE'])).toBe(true);
      expect(richPermask.check(customPerm).can('PRINT')).toBe(false);
    });
  });
  
  describe('Default Constants', () => {
    it('should use default access bits and mask when not specified', () => {
      // Create a permask without specifying accessBits or accessMask
      const defaultPermask = new PermaskBuilder().build();
      
      // Verify that the default ACCESS_BITS is 3
      expect(defaultPermask.accessBits).toBe(3);
      
      // Verify that the default ACCESS_MASK is 7 (binary: 111, which is (1 << 3) - 1)
      expect(defaultPermask.accessMask).toBe(7);
      
      // Verify that all permission bits fit within the mask
      // The mask 7 (binary 111) has 3 bits, so 1, 2, and 4 should all fit
      const allPerms = defaultPermask.for(1).grantAll().value();
      expect(allPerms & 7).toBe(7);
    });
    
    it('should use default permission values when not specified', () => {
      // Create a default permask without specifying custom permissions
      const defaultPermask = new PermaskBuilder().build();
      
      // Add permissions to test default values
      const readPerm = defaultPermask.for(1).grant(['READ']).value();
      const writePerm = defaultPermask.for(1).grant(['WRITE']).value();
      const deletePerm = defaultPermask.for(1).grant(['DELETE']).value();
      
      // Verify READ permission = 1
      expect(defaultPermask.check(readPerm).can('READ')).toBe(true);
      expect(readPerm & 7).toBe(1);
      
      // Verify WRITE permission = 2
      expect(defaultPermask.check(writePerm).can('WRITE')).toBe(true);
      expect(writePerm & 7).toBe(2);
      
      // Verify DELETE permission = 4
      expect(defaultPermask.check(deletePerm).can('DELETE')).toBe(true);
      expect(deletePerm & 7).toBe(4);
      
      // Verify READ_ONLY preset is same as READ permission
      expect(defaultPermask.READ_ONLY).toBe(1);
      
      // Verify READ_WRITE preset is READ | WRITE
      expect(defaultPermask.READ_WRITE).toBe(3);
    });
    
    it('should calculate access mask correctly for different bit sizes', () => {
      // Create permasks with different accessBits to verify mask calculation
      const bits4Permask = new PermaskBuilder({ accessBits: 4 }).build();
      const bits5Permask = new PermaskBuilder({ accessBits: 5 }).build();
      
      // 4 bits should give mask 15 (binary: 1111)
      expect(bits4Permask.accessMask).toBe(15);
      
      // 5 bits should give mask 31 (binary: 11111)
      expect(bits5Permask.accessMask).toBe(31);
    });
  });
});

describe('New Permask API', () => {
  let permask: Permask<{
    VIEW: number;
    EDIT: number;
    DELETE: number;
    SHARE: number;
    PRINT: number;
  }>;
  
  beforeEach(() => {
    // Create using builder pattern
    permask = new PermaskBuilder<{
      VIEW: number;
      EDIT: number;
      DELETE: number;
      SHARE: number;
      PRINT: number;
    }>({
      permissions: {
        VIEW: 1,
        EDIT: 2,
        DELETE: 4,
        SHARE: 8,
        PRINT: 16
      },
      accessBits: 6,
      groups: {
        DOCUMENTS: 1,
        PHOTOS: 2,
        VIDEOS: 3
      }
    })
    .definePermissionSet('VIEWER', ['VIEW'])
    .definePermissionSet('EDITOR', ['VIEW', 'EDIT'])
    .definePermissionSet('MANAGER', ['VIEW', 'EDIT', 'DELETE'])
    .definePermissionSet('ADMIN', ['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT'])
    .build();
  });
  
  describe('Building Permissions', () => {
    it('should create permissions using the fluent API', () => {
      // Grant specific permissions
      const viewEditPerm = permask.for('DOCUMENTS').grant(['VIEW', 'EDIT']).value();
      
      expect(permask.check(viewEditPerm).can('VIEW')).toBe(true);
      expect(permask.check(viewEditPerm).can('EDIT')).toBe(true);
      expect(permask.check(viewEditPerm).can('DELETE')).toBe(false);
      expect(permask.check(viewEditPerm).inGroup('DOCUMENTS')).toBe(true);
    });
    
    it('should support permission sets', () => {
      // Grant a permission set
      const managerPerm = permask.for('PHOTOS').grantSet('MANAGER').value();
      
      expect(permask.check(managerPerm).can('VIEW')).toBe(true);
      expect(permask.check(managerPerm).can('EDIT')).toBe(true);
      expect(permask.check(managerPerm).can('DELETE')).toBe(true);
      expect(permask.check(managerPerm).can('SHARE')).toBe(false);
      expect(permask.check(managerPerm).inGroup('PHOTOS')).toBe(true);
    });
    
    it('should handle ALL_PERMISSIONS', () => {
      // Grant all permissions
      const allPerm = permask.for('VIDEOS').grantAll().value();
      
      expect(permask.check(allPerm).canEverything()).toBe(true);
      expect(permask.check(allPerm).can('VIEW')).toBe(true);
      expect(permask.check(allPerm).can('EDIT')).toBe(true);
      expect(permask.check(allPerm).can('DELETE')).toBe(true);
      expect(permask.check(allPerm).can('SHARE')).toBe(true);
      expect(permask.check(allPerm).can('PRINT')).toBe(true);
    });
  });
  
  describe('Checking Permissions', () => {
    it('should check permissions with the fluent API', () => {
      const perm = permask.for('DOCUMENTS').grant(['VIEW', 'EDIT']).value();
      
      // Individual checks
      expect(permask.check(perm).can('VIEW')).toBe(true);
      expect(permask.check(perm).can('DELETE')).toBe(false);
      
      // Check multiple permissions
      expect(permask.check(perm).canAll(['VIEW', 'EDIT'])).toBe(true);
      expect(permask.check(perm).canAll(['VIEW', 'DELETE'])).toBe(false);
      expect(permask.check(perm).canAny(['DELETE', 'SHARE'])).toBe(false);
      expect(permask.check(perm).canAny(['EDIT', 'DELETE'])).toBe(true);
      
      // Group checks
      expect(permask.check(perm).inGroup('DOCUMENTS')).toBe(true);
      expect(permask.check(perm).inGroup('PHOTOS')).toBe(false);
      expect(permask.check(perm).group()).toBe(1);
      expect(permask.check(perm).groupName()).toBe('DOCUMENTS');
    });
    
    it('should provide detailed explanation of permissions', () => {
      const perm = permask.for('PHOTOS').grant(['VIEW', 'EDIT']).value();
      
      const details = permask.check(perm).explain();
      
      expect(details).toEqual({
        group: 2,
        groupName: 'PHOTOS',
        permissions: {
          VIEW: true,
          EDIT: true,
          DELETE: false,
          SHARE: false,
          PRINT: false
        }
      });
    });
  });
  
  describe('String Conversion', () => {
    it('should convert permissions to strings', () => {
      const perm1 = permask.for('DOCUMENTS').grant(['VIEW', 'EDIT']).value();
      const perm2 = permask.for('PHOTOS').grantAll().value();
      const perm3 = permask.for('VIDEOS').grant([]).value();
      
      expect(permask.toString(perm1)).toBe('DOCUMENTS:VIEW,EDIT');
      expect(permask.toString(perm2)).toBe('PHOTOS:ALL');
      expect(permask.toString(perm3)).toBe('VIDEOS:NONE');
    });
    
    it('should parse permission strings', () => {
      const perm1 = permask.fromString('DOCUMENTS:VIEW,EDIT');
      const perm2 = permask.fromString('PHOTOS:ALL');
      const perm3 = permask.fromString('VIDEOS:MANAGER');
      
      expect(permask.check(perm1).can('VIEW')).toBe(true);
      expect(permask.check(perm1).can('EDIT')).toBe(true);
      expect(permask.check(perm1).can('DELETE')).toBe(false);
      
      expect(permask.check(perm2).canEverything()).toBe(true);
      
      expect(permask.check(perm3).can('VIEW')).toBe(true);
      expect(permask.check(perm3).can('EDIT')).toBe(true);
      expect(permask.check(perm3).can('DELETE')).toBe(true);
      expect(permask.check(perm3).can('SHARE')).toBe(false);
    });
  });
  
  describe('Builder Pattern', () => {
    it('should modify existing permissions using toBuilder', () => {
      // Create a modified version of the permask
      const extendedPermask = permask.toBuilder()
        .definePermission('APPROVE', 32)
        .defineGroup('REPORTS', 4)
        .build();
      
      const reportPerm = extendedPermask.for('REPORTS').grant(['VIEW', 'APPROVE']).value();
      
      expect(extendedPermask.check(reportPerm).can('APPROVE')).toBe(true);
      expect(extendedPermask.check(reportPerm).inGroup('REPORTS')).toBe(true);
    });
  });
});
