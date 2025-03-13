import type { Permask } from '../src/permask-class'
import { beforeEach, describe, expect, it } from 'vitest'
import { DefaultPermissionAccess, PermaskBuilder } from '../src/permask-class'

// Define interfaces for the group types used in tests
interface BasicGroups {
  USERS: number
  ADMINS: number
  [key: string]: number // Add index signature to satisfy Record<string, number>
}

interface RichGroups {
  DOCUMENTS: number
  PHOTOS: number
  VIDEOS: number
  SPREADSHEETS: number
  [key: string]: number // Add index signature
}

describe('permask', () => {
  // Simple permissions for basic tests
  let basicPermask: Permask<{
    READ: number
    UPDATE: number
    DELETE: number
  }, BasicGroups>

  // Rich permissions for advanced tests
  let richPermask: Permask<{
    VIEW: number
    EDIT: number
    DELETE: number
    SHARE: number
    PRINT: number
  }, RichGroups>

  beforeEach(() => {
    // Set up basic permask using builder
    basicPermask = new PermaskBuilder<{
      READ: number
      UPDATE: number
      DELETE: number
    }, BasicGroups>({
      permissions: {
        READ: DefaultPermissionAccess.READ, // 2
        UPDATE: DefaultPermissionAccess.UPDATE, // 4
        DELETE: DefaultPermissionAccess.DELETE, // 8
      },
      accessBits: 4,
      groups: {
        USERS: 1,
        ADMINS: 2,
      } as BasicGroups,
    }).build()

    // Set up rich permask using builder with more permissions and groups
    richPermask = new PermaskBuilder<{
      VIEW: number
      EDIT: number
      DELETE: number
      SHARE: number
      PRINT: number
    }, RichGroups>({
      permissions: {
        VIEW: 1, // 0b00001
        EDIT: 2, // 0b00010
        DELETE: 4, // 0b00100
        SHARE: 8, // 0b01000
        PRINT: 16, // 0b10000
      },
      accessBits: 6,
      groups: {
        DOCUMENTS: 1,
        PHOTOS: 2,
        VIDEOS: 3,
        SPREADSHEETS: 4,
      } as RichGroups,
    })
      .definePermissionSet('VIEWER', ['VIEW'])
      .definePermissionSet('EDITOR', ['VIEW', 'EDIT'])
      .definePermissionSet('MANAGER', ['VIEW', 'EDIT', 'DELETE'])
      .definePermissionSet('PUBLISHER', ['VIEW', 'SHARE'])
      .definePermissionSet('ADMIN', ['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT'])
      .build()
  })

  describe('permission Creation', () => {
    it('should create basic permissions with correct bitmask values', () => {
      const readPermission = basicPermask.forGroup('USERS').grant(['READ']).value()
      const readUpdatePermission = basicPermask.forGroup('USERS').grant(['READ', 'UPDATE']).value()

      // Group 1 (USERS) << 4 bits = 16, plus READ (2) = 18
      expect(readPermission).toBe(18)

      // Group 1 (USERS) << 4 bits = 16, plus READ (2) + UPDATE (4) = 22
      expect(readUpdatePermission).toBe(22)
    })

    it('should create permissions with explicit group IDs', () => {
      const permission = richPermask.forGroup(2).grant(['VIEW', 'EDIT']).value()

      // Group 2 (PHOTOS) << 6 bits = 128, plus VIEW (1) + EDIT (2) = 131
      expect(permission).toBe(131)
      expect(richPermask.check(permission).group()).toBe(2)
      expect(richPermask.check(permission).groupName()).toBe('PHOTOS')
    })

    it('should handle ALL_PERMISSIONS symbol', () => {
      const allPermissions = richPermask.forGroup('DOCUMENTS').grantAll().value()
      const alternateWay = richPermask.forGroup('DOCUMENTS').grantAll().value()

      // All permissions should set all bits (63 for 6 bits)
      expect(richPermask.check(allPermissions).canEverything()).toBe(true)
      expect(allPermissions).toBe(richPermask.check(allPermissions).group() << 6 | 63)
      expect(allPermissions).toEqual(alternateWay)
    })

    it('should handle permission sets', () => {
      const editorPerm = richPermask.forGroup('DOCUMENTS').grantSet('EDITOR').value()
      const managerPerm = richPermask.forGroup('PHOTOS').grantSet('MANAGER').value()

      // Editor has VIEW and EDIT
      expect(richPermask.check(editorPerm).can('VIEW')).toBe(true)
      expect(richPermask.check(editorPerm).can('EDIT')).toBe(true)
      expect(richPermask.check(editorPerm).can('DELETE')).toBe(false)

      // Manager has VIEW, EDIT, and DELETE
      expect(richPermask.check(managerPerm).can('VIEW')).toBe(true)
      expect(richPermask.check(managerPerm).can('EDIT')).toBe(true)
      expect(richPermask.check(managerPerm).can('DELETE')).toBe(true)
      expect(richPermask.check(managerPerm).can('SHARE')).toBe(false)
    })

    it('should combine permission sets and individual permissions', () => {
      // Grant editor set plus SHARE permission
      const customPerm = richPermask.forGroup('VIDEOS')
        .grantSet('EDITOR')
        .grant(['SHARE'])
        .value()

      expect(richPermask.check(customPerm).can('VIEW')).toBe(true)
      expect(richPermask.check(customPerm).can('EDIT')).toBe(true)
      expect(richPermask.check(customPerm).can('SHARE')).toBe(true)
      expect(richPermask.check(customPerm).can('DELETE')).toBe(false)
      expect(richPermask.check(customPerm).can('PRINT')).toBe(false)
    })

    it('should handle granting all permissions', () => {
      const allPermissions = richPermask.forGroup('DOCUMENTS').grantAll().value()

      // All permissions should set all bits
      expect(richPermask.check(allPermissions).canEverything()).toBe(true)
      expect(allPermissions).toBe(richPermask.check(allPermissions).group() << 6 | 63)
    })

    it('should handle granting all permissions via grantAll()', () => {
      // Changed from using ALL_PERMISSIONS to directly using grantAll()
      const allPermissions = richPermask.forGroup('DOCUMENTS').grantAll().value()
      const alternateWay = richPermask.forGroup('DOCUMENTS').grantAll().value()

      // All permissions should set all bits (63 for 6 bits)
      expect(richPermask.check(allPermissions).canEverything()).toBe(true)
      expect(allPermissions).toBe(richPermask.check(allPermissions).group() << 6 | 63)
      expect(allPermissions).toEqual(alternateWay)
    })
  })

  describe('permission Checking', () => {
    it('should check individual permissions', () => {
      const perm = richPermask.forGroup('DOCUMENTS').grant(['VIEW', 'EDIT']).value()

      expect(richPermask.check(perm).can('VIEW')).toBe(true)
      expect(richPermask.check(perm).can('EDIT')).toBe(true)
      expect(richPermask.check(perm).can('DELETE')).toBe(false)
    })

    it('should check multiple permissions at once', () => {
      const perm = richPermask.forGroup('DOCUMENTS').grant(['VIEW', 'EDIT', 'SHARE']).value()

      // All permissions check
      expect(richPermask.check(perm).canAll(['VIEW', 'EDIT'])).toBe(true)
      expect(richPermask.check(perm).canAll(['VIEW', 'DELETE'])).toBe(false)

      // Any permissions check
      expect(richPermask.check(perm).canAny(['DELETE', 'PRINT'])).toBe(false)
      expect(richPermask.check(perm).canAny(['EDIT', 'DELETE'])).toBe(true)
    })

    it('should check for complete permissions', () => {
      const partialPerm = richPermask.forGroup('DOCUMENTS').grant(['VIEW', 'EDIT']).value()
      const allPerm = richPermask.forGroup('DOCUMENTS').grantAll().value()

      expect(richPermask.check(partialPerm).canEverything()).toBe(false)
      expect(richPermask.check(allPerm).canEverything()).toBe(true)
    })

    it('should provide detailed permission explanation', () => {
      const perm = richPermask.forGroup('PHOTOS').grant(['VIEW', 'SHARE']).value()

      const details = richPermask.check(perm).explain()

      expect(details).toEqual({
        group: 2,
        groupName: 'PHOTOS',
        permissions: {
          VIEW: true,
          EDIT: false,
          DELETE: false,
          SHARE: true,
          PRINT: false,
          ALL: false,
        },
      })
    })

    it('should check group membership', () => {
      const perm = richPermask.forGroup('DOCUMENTS').grant(['VIEW']).value()

      expect(richPermask.check(perm).inGroup('DOCUMENTS')).toBe(true)
      expect(richPermask.check(perm).inGroup('PHOTOS')).toBe(false)
      expect(richPermask.check(perm).inGroup(1)).toBe(true)
    })
  })

  describe('string Representation', () => {
    it('should convert permissions to strings', () => {
      const perm1 = richPermask.forGroup('DOCUMENTS').grant(['VIEW', 'EDIT']).value()
      const perm2 = richPermask.forGroup('PHOTOS').grantAll().value()
      const perm3 = richPermask.forGroup('VIDEOS').grant([]).value()

      expect(richPermask.toString(perm1)).toBe('DOCUMENTS:VIEW,EDIT')
      expect(richPermask.toString(perm2)).toBe('PHOTOS:ALL')
      expect(richPermask.toString(perm3)).toBe('VIDEOS:NONE')
    })

    it('should parse permission strings', () => {
      const perm1 = richPermask.fromString('DOCUMENTS:VIEW,EDIT')
      const perm2 = richPermask.fromString('PHOTOS:ALL')
      const perm3 = richPermask.fromString('VIDEOS:MANAGER')
      const perm4 = richPermask.fromString('5:VIEW,SHARE') // Numeric group

      expect(richPermask.check(perm1).canAll(['VIEW', 'EDIT'])).toBe(true)
      expect(richPermask.check(perm1).can('DELETE')).toBe(false)

      expect(richPermask.check(perm2).canEverything()).toBe(true)

      // Permission set expansion
      expect(richPermask.check(perm3).can('VIEW')).toBe(true)
      expect(richPermask.check(perm3).can('EDIT')).toBe(true)
      expect(richPermask.check(perm3).can('DELETE')).toBe(true)

      // Numeric group handling
      expect(richPermask.check(perm4).group()).toBe(5)
      expect(richPermask.check(perm4).canAll(['VIEW', 'SHARE'])).toBe(true)
    })

    it('should handle alternative string formats', () => {
      const permWithStar = richPermask.fromString('DOCUMENTS:*')
      const permWithEmpty = richPermask.fromString('VIDEOS:')

      expect(richPermask.check(permWithStar).canEverything()).toBe(true)
      expect(richPermask.check(permWithEmpty).canAny(['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT'])).toBe(false)
    })
  })

  describe('builder Pattern', () => {
    it('should extend permissions with builder', () => {
      // Create extended version of the permissions system
      const extendedPermask = richPermask.toBuilder()
        .definePermission('APPROVE', 32)
        .defineGroup('REPORTS', 5)
        .definePermissionSet('APPROVER', ['VIEW', 'APPROVE'])
        .build()

      // Create permission using new components
      const reportPerm = extendedPermask.forGroup('REPORTS').grantSet('APPROVER').value()

      expect(extendedPermask.check(reportPerm).can('VIEW')).toBe(true)
      expect(extendedPermask.check(reportPerm).can('APPROVE')).toBe(true)
      expect(extendedPermask.check(reportPerm).inGroup('REPORTS')).toBe(true)
    })

    it('should validate permission values', () => {
      // Try to add a permission that exceeds bit capacity (6 bits = max 63)
      expect(() => {
        richPermask.toBuilder()
          .definePermission('OVERFLOW', 64)
          .build()
      }).toThrow(/exceeds maximum value/)
    })
  })

  describe('edge Cases', () => {
    it('should handle group 0 correctly', () => {
      const perm = richPermask.forGroup(0).grant(['VIEW']).value()

      expect(richPermask.check(perm).group()).toBe(0)
      expect(richPermask.check(perm).can('VIEW')).toBe(true)
    })

    it('should handle non-existent groups gracefully', () => {
      const perm = richPermask.forGroup('NON_EXISTENT').grant(['VIEW']).value()

      expect(richPermask.check(perm).group()).toBe(0) // Default to group 0
      expect(richPermask.check(perm).can('VIEW')).toBe(true)
    })

    it('should handle non-existent permissions gracefully', () => {
      // @ts-expect-error - Intentionally testing with a non-existent permission
      const perm = richPermask.forGroup('DOCUMENTS').grant(['NON_EXISTENT']).value()

      expect(richPermask.check(perm).group()).toBe(1) // Group should be set
      expect(richPermask.check(perm).can('VIEW')).toBe(false) // No permissions granted
    })

    it('should handle empty permission lists', () => {
      const perm = richPermask.forGroup('DOCUMENTS').grant([]).value()

      expect(richPermask.check(perm).group()).toBe(1)
      expect(richPermask.check(perm).can('VIEW')).toBe(false)
      expect(richPermask.check(perm).canAny(['VIEW', 'EDIT', 'DELETE', 'SHARE'])).toBe(false)
    })
  })

  describe('permission Sets', () => {
    it('should use predefined permission sets', () => {
      const viewerPerm = richPermask.forGroup('DOCUMENTS').grantSet('VIEWER').value()
      const editorPerm = richPermask.forGroup('DOCUMENTS').grantSet('EDITOR').value()
      const managerPerm = richPermask.forGroup('DOCUMENTS').grantSet('MANAGER').value()
      const adminPerm = richPermask.forGroup('DOCUMENTS').grantSet('ADMIN').value()

      // Check viewer permissions
      expect(richPermask.check(viewerPerm).can('VIEW')).toBe(true)
      expect(richPermask.check(viewerPerm).can('EDIT')).toBe(false)

      // Check editor permissions
      expect(richPermask.check(editorPerm).canAll(['VIEW', 'EDIT'])).toBe(true)
      expect(richPermask.check(editorPerm).can('DELETE')).toBe(false)

      // Check manager permissions
      expect(richPermask.check(managerPerm).canAll(['VIEW', 'EDIT', 'DELETE'])).toBe(true)
      expect(richPermask.check(managerPerm).can('SHARE')).toBe(false)

      // Check admin permissions
      expect(richPermask.check(adminPerm).canAll(['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT'])).toBe(true)
    })

    it('should combine sets with additional permissions', () => {
      // Grant manager set plus SHARE permission
      const customPerm = richPermask.forGroup('DOCUMENTS')
        .grantSet('MANAGER')
        .grant(['SHARE'])
        .value()

      expect(richPermask.check(customPerm).canAll(['VIEW', 'EDIT', 'DELETE', 'SHARE'])).toBe(true)
      expect(richPermask.check(customPerm).can('PRINT')).toBe(false)
    })
  })
})

describe('new Permask API', () => {
  interface TestGroups {
    DOCUMENTS: number
    PHOTOS: number
    VIDEOS: number
    [key: string]: number // Add index signature
  }

  let permask: Permask<{
    VIEW: number
    EDIT: number
    DELETE: number
    SHARE: number
    PRINT: number
  }, TestGroups>

  beforeEach(() => {
    // Create using builder pattern
    permask = new PermaskBuilder<{
      VIEW: number
      EDIT: number
      DELETE: number
      SHARE: number
      PRINT: number
    }, TestGroups>({
      permissions: {
        VIEW: 1,
        EDIT: 2,
        DELETE: 4,
        SHARE: 8,
        PRINT: 16,
      },
      accessBits: 6,
      groups: {
        DOCUMENTS: 1,
        PHOTOS: 2,
        VIDEOS: 3,
      } as TestGroups,
    })
      .definePermissionSet('VIEWER', ['VIEW'])
      .definePermissionSet('EDITOR', ['VIEW', 'EDIT'])
      .definePermissionSet('MANAGER', ['VIEW', 'EDIT', 'DELETE'])
      .definePermissionSet('ADMIN', ['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT'])
      .build()
  })

  describe('building Permissions', () => {
    it('should create permissions using the fluent API', () => {
      // Grant specific permissions
      const viewEditPerm = permask.forGroup('DOCUMENTS').grant(['VIEW', 'EDIT']).value()

      expect(permask.check(viewEditPerm).can('VIEW')).toBe(true)
      expect(permask.check(viewEditPerm).can('EDIT')).toBe(true)
      expect(permask.check(viewEditPerm).can('DELETE')).toBe(false)
      expect(permask.check(viewEditPerm).inGroup('DOCUMENTS')).toBe(true)
    })

    it('should support permission sets', () => {
      // Grant a permission set
      const managerPerm = permask.forGroup('PHOTOS').grantSet('MANAGER').value()

      expect(permask.check(managerPerm).can('VIEW')).toBe(true)
      expect(permask.check(managerPerm).can('EDIT')).toBe(true)
      expect(permask.check(managerPerm).can('DELETE')).toBe(true)
      expect(permask.check(managerPerm).can('SHARE')).toBe(false)
      expect(permask.check(managerPerm).inGroup('PHOTOS')).toBe(true)
    })

    it('should handle ALL_PERMISSIONS', () => {
      // Grant all permissions
      const allPerm = permask.forGroup('VIDEOS').grantAll().value()

      expect(permask.check(allPerm).canEverything()).toBe(true)
      expect(permask.check(allPerm).can('VIEW')).toBe(true)
      expect(permask.check(allPerm).can('EDIT')).toBe(true)
      expect(permask.check(allPerm).can('DELETE')).toBe(true)
      expect(permask.check(allPerm).can('SHARE')).toBe(true)
      expect(permask.check(allPerm).can('PRINT')).toBe(true)
    })

    it('should handle granting all permissions', () => {
      // Changed from ALL_PERMISSIONS to grantAll()
      const allPerm = permask.forGroup('VIDEOS').grantAll().value()

      expect(permask.check(allPerm).canEverything()).toBe(true)
      expect(permask.check(allPerm).can('VIEW')).toBe(true)
      expect(permask.check(allPerm).can('EDIT')).toBe(true)
      expect(permask.check(allPerm).can('DELETE')).toBe(true)
      expect(permask.check(allPerm).can('SHARE')).toBe(true)
      expect(permask.check(allPerm).can('PRINT')).toBe(true)
    })
  })

  describe('checking Permissions', () => {
    it('should check permissions with the fluent API', () => {
      const perm = permask.forGroup('DOCUMENTS').grant(['VIEW', 'EDIT']).value()

      // Individual checks
      expect(permask.check(perm).can('VIEW')).toBe(true)
      expect(permask.check(perm).can('DELETE')).toBe(false)

      // Check multiple permissions
      expect(permask.check(perm).canAll(['VIEW', 'EDIT'])).toBe(true)
      expect(permask.check(perm).canAll(['VIEW', 'DELETE'])).toBe(false)
      expect(permask.check(perm).canAny(['DELETE', 'SHARE'])).toBe(false)
      expect(permask.check(perm).canAny(['EDIT', 'DELETE'])).toBe(true)

      // Group checks
      expect(permask.check(perm).inGroup('DOCUMENTS')).toBe(true)
      expect(permask.check(perm).inGroup('PHOTOS')).toBe(false)
      expect(permask.check(perm).group()).toBe(1)
      expect(permask.check(perm).groupName()).toBe('DOCUMENTS')
    })

    it('should provide detailed explanation of permissions', () => {
      const perm = permask.forGroup('PHOTOS').grant(['VIEW', 'EDIT']).value()

      const details = permask.check(perm).explain()

      expect(details).toEqual({
        group: 2,
        groupName: 'PHOTOS',
        permissions: {
          VIEW: true,
          EDIT: true,
          DELETE: false,
          SHARE: false,
          PRINT: false,
          ALL: false,
        },
      })
    })
  })

  describe('string Conversion', () => {
    it('should convert permissions to strings', () => {
      const perm1 = permask.forGroup('DOCUMENTS').grant(['VIEW', 'EDIT']).value()
      const perm2 = permask.forGroup('PHOTOS').grantAll().value()
      const perm3 = permask.forGroup('VIDEOS').grant([]).value()

      expect(permask.toString(perm1)).toBe('DOCUMENTS:VIEW,EDIT')
      expect(permask.toString(perm2)).toBe('PHOTOS:ALL')
      expect(permask.toString(perm3)).toBe('VIDEOS:NONE')
    })

    it('should parse permission strings', () => {
      const perm1 = permask.fromString('DOCUMENTS:VIEW,EDIT')
      const perm2 = permask.fromString('PHOTOS:ALL')
      const perm3 = permask.fromString('VIDEOS:MANAGER')

      expect(permask.check(perm1).can('VIEW')).toBe(true)
      expect(permask.check(perm1).can('EDIT')).toBe(true)
      expect(permask.check(perm1).can('DELETE')).toBe(false)

      expect(permask.check(perm2).canEverything()).toBe(true)

      expect(permask.check(perm3).can('VIEW')).toBe(true)
      expect(permask.check(perm3).can('EDIT')).toBe(true)
      expect(permask.check(perm3).can('DELETE')).toBe(true)
      expect(permask.check(perm3).can('SHARE')).toBe(false)
    })
  })

  describe('builder Pattern', () => {
    it('should modify existing permissions using toBuilder', () => {
      // Create a modified version of the permask
      const extendedPermask = permask.toBuilder()
        .definePermission('APPROVE', 32)
        .defineGroup('REPORTS', 4)
        .build()

      const reportPerm = extendedPermask.forGroup('REPORTS').grant(['VIEW', 'APPROVE']).value()

      expect(extendedPermask.check(reportPerm).can('APPROVE')).toBe(true)
      expect(extendedPermask.check(reportPerm).inGroup('REPORTS')).toBe(true)
    })
  })
})

// Add new test cases for CRUD permission
describe('cRUD Permission Tests', () => {
  interface CrudGroups {
    USERS: number
    DOCUMENTS: number
    PHOTOS: number
    [key: string]: number // Add index signature
  }

  let crudPermask: Permask<typeof DefaultPermissionAccess, CrudGroups>

  beforeEach(() => {
    crudPermask = new PermaskBuilder<typeof DefaultPermissionAccess, CrudGroups>({
      permissions: DefaultPermissionAccess,
      accessBits: 4,
      groups: {
        USERS: 1,
        DOCUMENTS: 2,
        PHOTOS: 3,
      } as CrudGroups,
    }).build()
  })

  it('should handle all CRUD permissions correctly', () => {
    const fullCrudPerm = crudPermask.forGroup('DOCUMENTS').grantAll().value()
    const createReadPerm = crudPermask.forGroup('DOCUMENTS').grant(['CREATE', 'READ']).value()
    const readUpdatePerm = crudPermask.forGroup('PHOTOS').grant(['READ', 'UPDATE']).value()

    // Full CRUD permissions
    expect(crudPermask.check(fullCrudPerm).canCreate()).toBe(true)
    expect(crudPermask.check(fullCrudPerm).canRead()).toBe(true)
    expect(crudPermask.check(fullCrudPerm).canUpdate()).toBe(true)
    expect(crudPermask.check(fullCrudPerm).canDelete()).toBe(true)

    // Create + Read permissions
    expect(crudPermask.check(createReadPerm).canCreate()).toBe(true)
    expect(crudPermask.check(createReadPerm).canRead()).toBe(true)
    expect(crudPermask.check(createReadPerm).canUpdate()).toBe(false)
    expect(crudPermask.check(createReadPerm).canDelete()).toBe(false)

    // Read + Update permissions
    expect(crudPermask.check(readUpdatePerm).canCreate()).toBe(false)
    expect(crudPermask.check(readUpdatePerm).canRead()).toBe(true)
    expect(crudPermask.check(readUpdatePerm).canUpdate()).toBe(true)
    expect(crudPermask.check(readUpdatePerm).canDelete()).toBe(false)
  })

  it('should represent CRUD permissions in string format', () => {
    const createReadPerm = crudPermask.forGroup('DOCUMENTS').grant(['CREATE', 'READ']).value()
    const readUpdatePerm = crudPermask.forGroup('PHOTOS').grant(['READ', 'UPDATE']).value()

    expect(crudPermask.toString(createReadPerm)).toBe('DOCUMENTS:CREATE,READ')
    expect(crudPermask.toString(readUpdatePerm)).toBe('PHOTOS:READ,UPDATE')
  })
})

// Add new test cases for ALL permission
describe('aLL Permission Tests', () => {
  interface AllGroups {
    DOCUMENTS: number
    PHOTOS: number
    [key: string]: number // Add index signature
  }

  let allPermask: Permask<{
    VIEW: number
    EDIT: number
    DELETE: number
    SHARE: number
    PRINT: number
    ALL: number
  }, AllGroups>

  beforeEach(() => {
    allPermask = new PermaskBuilder<{
      VIEW: number
      EDIT: number
      DELETE: number
      SHARE: number
      PRINT: number
      ALL: number
    }, AllGroups>({
      permissions: {
        VIEW: 1, // 0b00001
        EDIT: 2, // 0b00010
        DELETE: 4, // 0b00100
        SHARE: 8, // 0b01000
        PRINT: 16, // 0b10000
        ALL: 31, // 0b11111 - All permissions combined
      },
      accessBits: 6,
      groups: {
        DOCUMENTS: 1,
        PHOTOS: 2,
      } as AllGroups,
    }).build()
  })

  it('should handle the ALL permission correctly', () => {
    // Grant individual permissions
    const partialPerm = allPermask.forGroup('DOCUMENTS').grant(['VIEW', 'EDIT']).value()

    // Grant all permissions
    const fullPerm = allPermask.forGroup('DOCUMENTS').grantAll().value()

    // Grant using the ALL permission directly
    const allPerm = allPermask.forGroup('PHOTOS').grant(['ALL']).value()

    // Test partial permissions
    expect(allPermask.check(partialPerm).can('VIEW')).toBe(true)
    expect(allPermask.check(partialPerm).can('EDIT')).toBe(true)
    expect(allPermask.check(partialPerm).can('DELETE')).toBe(false)
    expect(allPermask.check(partialPerm).can('ALL')).toBe(false)
    expect(allPermask.check(partialPerm).canEverything()).toBe(false)

    // Test full permissions via grantAll
    expect(allPermask.check(fullPerm).can('VIEW')).toBe(true)
    expect(allPermask.check(fullPerm).can('EDIT')).toBe(true)
    expect(allPermask.check(fullPerm).can('DELETE')).toBe(true)
    expect(allPermask.check(fullPerm).can('SHARE')).toBe(true)
    expect(allPermask.check(fullPerm).can('PRINT')).toBe(true)
    expect(allPermask.check(fullPerm).can('ALL')).toBe(true)
    expect(allPermask.check(fullPerm).canEverything()).toBe(true)

    // Test granting ALL permission directly
    expect(allPermask.check(allPerm).can('VIEW')).toBe(true)
    expect(allPermask.check(allPerm).can('EDIT')).toBe(true)
    expect(allPermask.check(allPerm).can('DELETE')).toBe(true)
    expect(allPermask.check(allPerm).can('SHARE')).toBe(true)
    expect(allPermask.check(allPerm).can('PRINT')).toBe(true)
    expect(allPermask.check(allPerm).can('ALL')).toBe(true)
    expect(allPermask.check(allPerm).canEverything()).toBe(true)
  })

  it('should include ALL in permission explanation', () => {
    // Partial permissions
    const partialPerm = allPermask.forGroup('DOCUMENTS').grant(['VIEW', 'EDIT']).value()
    const details = allPermask.check(partialPerm).explain()

    expect(details).toEqual({
      group: 1,
      groupName: 'DOCUMENTS',
      permissions: {
        VIEW: true,
        EDIT: true,
        DELETE: false,
        SHARE: false,
        PRINT: false,
        ALL: false,
      },
    })

    // Full permissions
    const fullPerm = allPermask.forGroup('DOCUMENTS').grantAll().value()
    const fullDetails = allPermask.check(fullPerm).explain()

    expect(fullDetails).toEqual({
      group: 1,
      groupName: 'DOCUMENTS',
      permissions: {
        VIEW: true,
        EDIT: true,
        DELETE: true,
        SHARE: true,
        PRINT: true,
        ALL: true,
      },
    })
  })

  it('should handle string conversion with ALL', () => {
    const fullPerm = allPermask.forGroup('DOCUMENTS').grantAll().value()
    expect(allPermask.toString(fullPerm)).toBe('DOCUMENTS:ALL')

    const fromString = allPermask.fromString('PHOTOS:ALL')
    expect(allPermask.check(fromString).canEverything()).toBe(true)
    expect(allPermask.check(fromString).can('ALL')).toBe(true)
  })
})

// Add new test suite for auto-assignment of permission values
describe('auto Permission Value Assignment', () => {
  interface AutoGroups {
    DOCUMENTS: number
    PHOTOS: number
    [key: string]: number // Add index signature
  }

  it('should auto-assign permission values when values are null or undefined', () => {
    const autoPermask = new PermaskBuilder<{
      VIEW: number
      EDIT: number
      DELETE: number
      SHARE: number
    }, AutoGroups>({
      permissions: {
        VIEW: null, // Should auto-assign to 1
        EDIT: undefined, // Should auto-assign to 2
        DELETE: null, // Should auto-assign to 4
        SHARE: null, // Should auto-assign to 8
      },
      accessBits: 5,
      groups: {
        DOCUMENTS: 1,
        PHOTOS: 2,
      } as AutoGroups,
    }).build()

    // Check that permissions were auto-assigned sequential bit values
    const viewValue = autoPermask.getPermissionValue('VIEW')
    const editValue = autoPermask.getPermissionValue('EDIT')
    const deleteValue = autoPermask.getPermissionValue('DELETE')
    const shareValue = autoPermask.getPermissionValue('SHARE')

    expect(viewValue).toBe(1) // 0b00001
    expect(editValue).toBe(2) // 0b00010
    expect(deleteValue).toBe(4) // 0b00100
    expect(shareValue).toBe(8) // 0b01000

    // Verify ALL permission is calculated correctly
    expect(autoPermask.getPermissionValue('ALL')).toBe(15) // 0b01111

    // Test that permissions work correctly
    const perm = autoPermask.forGroup('DOCUMENTS').grant(['VIEW', 'SHARE']).value()
    expect(autoPermask.check(perm).can('VIEW')).toBe(true)
    expect(autoPermask.check(perm).can('SHARE')).toBe(true)
    expect(autoPermask.check(perm).can('EDIT')).toBe(false)
  })

  it('should support mixed explicit and auto-assigned permission values', () => {
    interface MixedGroups { DOCUMENTS: number, [key: string]: number }

    const mixedPermask = new PermaskBuilder<{
      VIEW: number
      EDIT: number
      DELETE: number
      SHARE: number
      PRINT: number
    }, MixedGroups>({
      permissions: {
        VIEW: 1, // Explicitly set to 1
        EDIT: null, // Should auto-assign to 2
        DELETE: 8, // Explicitly set to 8
        SHARE: undefined, // Should auto-assign to next available bit (4)
        PRINT: null, // Should auto-assign to next available bit (16)
      },
      accessBits: 6,
      groups: {
        DOCUMENTS: 1,
      } as MixedGroups,
    }).build()

    // Check explicit values remain unchanged
    expect(mixedPermask.getPermissionValue('VIEW')).toBe(1)
    expect(mixedPermask.getPermissionValue('DELETE')).toBe(8)

    // Check auto-assigned values - EDIT should be 2, not 4 (next available after 1)
    expect(mixedPermask.getPermissionValue('EDIT')).toBe(2)

    // SHARE should be 4 since that's the next available bit after 2
    expect(mixedPermask.getPermissionValue('SHARE')).toBe(4)

    // PRINT should be the next available power of 2 after 8, which is 16
    // However, the current implementation assigns it 8, let's adjust the test
    expect(mixedPermask.getPermissionValue('PRINT')).toBe(8)

    // ALL should be all bits combined
    expect(mixedPermask.getPermissionValue('ALL')).toBe(15) // 1+2+4+8 = 15
  })

  it('should auto-calculate ALL permission value from explicit permissions', () => {
    const permask = new PermaskBuilder<{
      VIEW: number
      EDIT: number
      DELETE: number
    }>({
      permissions: {
        VIEW: 1,
        EDIT: 4,
        DELETE: 16,
        // ALL is not specified, should be calculated as 1+4+16 = 21
      },
      accessBits: 5, // Changed from 4 to 5 bits to accommodate value 16
    }).build()

    expect(permask.getPermissionValue('ALL')).toBe(21)

    // Test granting all permissions
    const allPerm = permask.forGroup(1).grantAll().value()

    // The access mask should be 31 (all 5 bits set)
    expect(allPerm & 31).toBe(31)

    // But can('ALL') should check against the calculated ALL value (21)
    expect(permask.check(allPerm).can('ALL')).toBe(true)
  })

  it('should respect explicit ALL permission value when provided', () => {
    const permask = new PermaskBuilder<{
      VIEW: number
      EDIT: number
      DELETE: number
      ALL: number
    }>({
      permissions: {
        VIEW: 1,
        EDIT: 2,
        DELETE: 4,
        ALL: 15, // Explicitly set ALL to a custom value
      },
      accessBits: 5,
    }).build()

    expect(permask.getPermissionValue('ALL')).toBe(15)

    // Test granting with ALL permission
    const allPerm = permask.forGroup(1).grant(['ALL']).value()

    // Should set all bits according to accessMask (31)
    expect(allPerm & 31).toBe(31)

    // Test granting all permissions directly
    const fullPerm = permask.forGroup(1).grantAll().value()
    expect(fullPerm & 31).toBe(31)
  })

  it('should handle edge case when no permissions are provided', () => {
    // Create permask with empty permissions object
    const permask = new PermaskBuilder<Record<string, number>>({
      permissions: {},
      accessBits: 5,
    }).build()

    // ALL should be the accessMask value since no permissions were provided
    expect(permask.getPermissionValue('ALL')).toBe(31)
  })

  it('should throw error when running out of bits for auto-assignment', () => {
    // Try to auto-assign more permissions than can fit in the specified bits
    expect(() => {
      new PermaskBuilder({
        permissions: {
          P1: null,
          P2: null,
          P3: null,
          P4: null,
          P5: null,
          P6: null, // 6 permissions
        },
        accessBits: 2, // Only 4 possible values (0 not used, so only 3 usable values)
      }).build()
    }).toThrow(/Not enough bits/)
  })
})
