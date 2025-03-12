import { describe, it, expect, beforeEach } from 'vitest';
import { DefaultPermissionAccess, Permask, PermaskBuilder } from '../src/permask-class';

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
        READ: DefaultPermissionAccess.READ,    // 2
        WRITE: DefaultPermissionAccess.WRITE,  // 8
        DELETE: DefaultPermissionAccess.DELETE // 16
      },
      accessBits: 5,
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
      
      // Group 1 (USERS) << 5 bits = 32, plus READ (2) = 34
      expect(readPermission).toBe(34);
      
      // Group 1 (USERS) << 5 bits = 32, plus READ (2) + WRITE (8) = 42
      expect(readWritePermission).toBe(42);
    });
    
    it('should create permissions with explicit group IDs', () => {
      const permission = richPermask.for(2).grant(['VIEW', 'EDIT']).value();
      
      // Group 2 (PHOTOS) << 6 bits = 128, plus VIEW (1) + EDIT (2) = 131
      expect(permission).toBe(131);
      expect(richPermask.check(permission).group()).toBe(2);
      expect(richPermask.check(permission).groupName()).toBe('PHOTOS');
    });
    
    it('should handle ALL_PERMISSIONS symbol', () => {
      const allPermissions = richPermask.for('DOCUMENTS').grantAll().value();
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

    it('should handle granting all permissions', () => {
      const allPermissions = richPermask.for('DOCUMENTS').grantAll().value();
      
      // All permissions should set all bits
      expect(richPermask.check(allPermissions).canEverything()).toBe(true);
      expect(allPermissions).toBe(richPermask.check(allPermissions).group() << 6 | 63);
    });

    it('should handle granting all permissions via grantAll()', () => {
      // Changed from using ALL_PERMISSIONS to directly using grantAll()
      const allPermissions = richPermask.for('DOCUMENTS').grantAll().value();
      const alternateWay = richPermask.for('DOCUMENTS').grantAll().value();
      
      // All permissions should set all bits (63 for 6 bits)
      expect(richPermask.check(allPermissions).canEverything()).toBe(true);
      expect(allPermissions).toBe(richPermask.check(allPermissions).group() << 6 | 63);
      expect(allPermissions).toEqual(alternateWay);
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

    it('should handle granting all permissions', () => {
      // Changed from ALL_PERMISSIONS to grantAll()
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

// Add new test cases for CREATE and UPDATE permissions
describe('CRUD Permission Tests', () => {
  let crudPermask: Permask<typeof DefaultPermissionAccess>;
  
  beforeEach(() => {
    crudPermask = new PermaskBuilder({
      permissions: DefaultPermissionAccess,
      accessBits: 5,
      groups: {
        USERS: 1,
        DOCUMENTS: 2,
        PHOTOS: 3
      }
    }).build();
  });
  
  it('should handle all CRUD permissions correctly', () => {
    const fullCrudPerm = crudPermask.for('DOCUMENTS').grantAll().value();
    const createReadPerm = crudPermask.for('DOCUMENTS').grant(['CREATE', 'READ']).value();
    const readUpdatePerm = crudPermask.for('PHOTOS').grant(['READ', 'UPDATE']).value();
    
    // Full CRUD permissions
    expect(crudPermask.check(fullCrudPerm).canCreate()).toBe(true);
    expect(crudPermask.check(fullCrudPerm).canRead()).toBe(true);
    expect(crudPermask.check(fullCrudPerm).canUpdate()).toBe(true);
    expect(crudPermask.check(fullCrudPerm).canWrite()).toBe(true);
    expect(crudPermask.check(fullCrudPerm).canDelete()).toBe(true);
    
    // Create + Read permissions
    expect(crudPermask.check(createReadPerm).canCreate()).toBe(true);
    expect(crudPermask.check(createReadPerm).canRead()).toBe(true);
    expect(crudPermask.check(createReadPerm).canUpdate()).toBe(false);
    expect(crudPermask.check(createReadPerm).canWrite()).toBe(false);
    expect(crudPermask.check(createReadPerm).canDelete()).toBe(false);
    
    // Read + Update permissions
    expect(crudPermask.check(readUpdatePerm).canCreate()).toBe(false);
    expect(crudPermask.check(readUpdatePerm).canRead()).toBe(true);
    expect(crudPermask.check(readUpdatePerm).canUpdate()).toBe(true);
    expect(crudPermask.check(readUpdatePerm).canWrite()).toBe(false);
    expect(crudPermask.check(readUpdatePerm).canDelete()).toBe(false);
  });
  
  it('should represent CRUD permissions in string format', () => {
    const createReadPerm = crudPermask.for('DOCUMENTS').grant(['CREATE', 'READ']).value();
    const readUpdateWritePerm = crudPermask.for('PHOTOS').grant(['READ', 'UPDATE', 'WRITE']).value();
    
    expect(crudPermask.toString(createReadPerm)).toBe('DOCUMENTS:CREATE,READ');
    expect(crudPermask.toString(readUpdateWritePerm)).toBe('PHOTOS:READ,UPDATE,WRITE');
  });
});

// Add test suite for the parseSimple method
describe('ParseSimple Method Tests', () => {
  let permask: Permask<{
    VIEW: number;
    EDIT: number;
    DELETE: number;
    SHARE: number;
    PRINT: number;
    FULL: number;
  }>;
  
  beforeEach(() => {
    permask = new PermaskBuilder<{
      VIEW: number;
      EDIT: number;
      DELETE: number;
      SHARE: number;
      PRINT: number;
      FULL: number;
    }>({
      permissions: {
        VIEW: 1,
        EDIT: 2,
        DELETE: 4,
        SHARE: 8,
        PRINT: 16,
        FULL: 31
      },
      accessBits: 6,
      groups: {
        DOCUMENTS: 1,
        PHOTOS: 2,
        VIDEOS: 3
      }
    }).build();
  });

  it('should return a flattened representation of permissions', () => {
    // Create permissions with different settings
    const basicPerm = permask.for('DOCUMENTS').grant(['VIEW', 'EDIT']).value();
    const allPerm = permask.for('PHOTOS').grantAll().value();
    const noPerm = permask.for('VIDEOS').grant([]).value();
    
    // Test basic permission
    const basicResult = permask.parseSimple(basicPerm);
    expect(basicResult).toEqual({
      group: 1,
      groupName: 'DOCUMENTS',
      view: true,
      edit: true,
      delete: false,
      share: false,
      print: false,
      full: false
    });
    
    // Test full permissions
    const allResult = permask.parseSimple(allPerm);
    expect(allResult).toEqual({
      group: 2,
      groupName: 'PHOTOS',
      view: true,
      edit: true,
      delete: true,
      share: true,
      print: true,
      full: false
    });
    
    // Test no permissions
    const noResult = permask.parseSimple(noPerm);
    expect(noResult).toEqual({
      group: 3,
      groupName: 'VIDEOS',
      view: false,
      edit: false,
      delete: false,
      share: false,
      print: false,
      full: false
    });
  });

  it('should work with numeric bitmasks directly', () => {
    // Using raw bitmasks (group 2 << 6 | VIEW+DELETE = 131)
    const manualBitmask = (2 << 6) | 5; // Group 2 with VIEW(1) and DELETE(4)
    
    const result = permask.parseSimple(manualBitmask);
    expect(result).toEqual({
      group: 2,
      groupName: 'PHOTOS',
      view: true,
      edit: false,
      delete: true,
      share: false,
      print: false,
      full: false,
    });
  });

  it('should work with unknown groups', () => {
    // Group 10 doesn't exist in the defined groups
    const unknownGroupPerm = permask.for(10).grant(['VIEW', 'SHARE']).value();
    
    const result = permask.parseSimple(unknownGroupPerm);
    expect(result).toEqual({
      group: 10,
      view: true,
      edit: false,
      delete: false,
      share: true,
      print: false,
      full: false,
    });
    // Note: no groupName property since the group is unknown
  });

  it('should work with default permissions', () => {
    // Create a permask with default CRUD permissions
    const crudPermask = new PermaskBuilder({
      permissions: DefaultPermissionAccess,
      groups: { USERS: 1 }
    }).build();
    
    const perm = crudPermask.for('USERS').grant(['CREATE', 'READ', 'UPDATE']).value();
    
    const result = crudPermask.parseSimple(perm);
    expect(result).toEqual({
      group: 1,
      groupName: 'USERS',
      create: true,
      read: true,
      update: true,
      write: false,
      delete: false,
      full: false
    });
  });
});
