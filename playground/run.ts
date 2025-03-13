import { DefaultPermissionAccess, PermaskBuilder } from 'permask';

console.log('=== Permask API Usage Examples ===\n');

// Example 1: Using default CRUD permissions
console.log('== Example 1: Default CRUD Permissions ==');

const crudPermask = new PermaskBuilder({
  permissions: DefaultPermissionAccess,
  groups: {
    USERS: 1,
    DOCUMENTS: 2,
    PHOTOS: 3
  }
}).build();

// Create a permission for documents with read and write access
const documentPermission = crudPermask.for('DOCUMENTS')
  .grant(['READ', 'CREATE'])
  .value();

console.log('Document Permission Details:', crudPermask.check(documentPermission).explain());
console.log('Can Read:', crudPermask.check(documentPermission).canRead()); // true
console.log('Can Write:', crudPermask.check(documentPermission).canCreate()); // true
console.log('Can Delete:', crudPermask.check(documentPermission).canDelete()); // false
console.log('String Representation:', crudPermask.toString(documentPermission)); // "DOCUMENTS:READ,WRITE"

// Parse from string
const parsedPermission = crudPermask.fromString('PHOTOS:CREATE,READ,UPDATE');
console.log('Parsed Permission Details:', crudPermask.check(parsedPermission).explain());

console.log('\n== Example 2: Custom Permissions ==');

// Example 2: Custom permissions with named groups
const customPermask = new PermaskBuilder<{
  VIEW: number;
  EDIT: number;
  DELETE: number;
  SHARE: number;
  PRINT: number;
  DOWNLOAD: number;
}>({
  permissions: {
    VIEW: 1,        // 0b000001
    EDIT: 2,        // 0b000010
    DELETE: 4,      // 0b000100
    SHARE: 8,       // 0b001000
    PRINT: 16,      // 0b010000
    DOWNLOAD: 32,   // 0b100000
  },
  accessBits: 8,
  groups: {
    DOCUMENTS: 1,
    PHOTOS: 2,
    VIDEOS: 3,
    FILES: 4,
    ADMIN: 100
  }
})
.definePermissionSet('VIEWER', ['VIEW', 'DOWNLOAD'])
.definePermissionSet('EDITOR', ['VIEW', 'EDIT', 'DOWNLOAD'])
.definePermissionSet('MANAGER', ['VIEW', 'EDIT', 'DELETE', 'SHARE'])
.definePermissionSet('ADMIN', ['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT', 'DOWNLOAD'])
.build();

// Create permission using specific permissions
const editorPermission = customPermask.for('DOCUMENTS')
  .grant(['VIEW', 'EDIT', 'SHARE'])
  .value();

console.log('Editor Permission Details:', customPermask.check(editorPermission).explain());

// Check specific permissions
console.log('Can View:', customPermask.check(editorPermission).can('VIEW')); // true
console.log('Can Delete:', customPermask.check(editorPermission).can('DELETE')); // false
console.log('Can View and Edit:', customPermask.check(editorPermission).canAll(['VIEW', 'EDIT'])); // true
console.log('Can Delete or Print:', customPermask.check(editorPermission).canAny(['DELETE', 'PRINT'])); // false

// Create permission using a permission set
const managerPermission = customPermask.for('PHOTOS')
  .grantSet('MANAGER')
  .value();

console.log('\nManager Permission Details:', customPermask.check(managerPermission).explain());

// Grant all permissions
const adminPermission = customPermask.for('ADMIN')
  .grantAll()
  .value();

console.log('\nAdmin Permission Details:', customPermask.check(adminPermission).explain());
console.log('Has all permissions:', customPermask.check(adminPermission).canEverything()); // true
console.log('String Representation:', customPermask.toString(adminPermission)); // "ADMIN:ALL"

console.log('\n== Example 3: Permission Sets and Extensions ==');

// Extend the permissions system
const extendedPermask = customPermask.toBuilder()
  .definePermission('APPROVE', 64)
  .defineGroup('REPORTS', 101)
  .definePermissionSet('APPROVER', ['VIEW', 'APPROVE'])
  .build();

// Create permission using new components
const reportPermission = extendedPermask.for('REPORTS')
  .grantSet('APPROVER')
  .value();

console.log('Report Permission Details:', extendedPermask.check(reportPermission).explain());

// Combine permission sets with individual permissions
const customPermission = extendedPermask.for('DOCUMENTS')
  .grantSet('EDITOR')
  .grant(['APPROVE'])
  .value();

console.log('\nCustom Permission Details:', extendedPermask.check(customPermission).explain());

console.log('\n== Example 4: String Conversion ==');

// Convert to string and back
const permissionString = extendedPermask.toString(customPermission);
console.log('Permission String:', permissionString);

const reconvertedPermission = extendedPermask.fromString(permissionString);
console.log('Reconverted Permission Details:', extendedPermask.check(reconvertedPermission).explain());

// Special string formats
console.log('\nSpecial String Formats:');
console.log('From "DOCUMENTS:ALL":', extendedPermask.check(extendedPermask.fromString('DOCUMENTS:ALL')).explain());
console.log('From "VIDEOS:*":', extendedPermask.check(extendedPermask.fromString('VIDEOS:*')).explain());
console.log('From "PHOTOS:VIEWER":', extendedPermask.check(extendedPermask.fromString('PHOTOS:VIEWER')).explain());

console.log('\n== Example 5: Auto-assigned Permission Values ==');

// Auto-assign permission values
const autoPermask = new PermaskBuilder<{
  READ: number;
  WRITE: number;
  EXECUTE: number;
  CONFIGURE: number;
}>({
  permissions: {
    READ: null,      // Will be auto-assigned to 1
    WRITE: null,     // Will be auto-assigned to 2
    EXECUTE: null,   // Will be auto-assigned to 4
    CONFIGURE: null, // Will be auto-assigned to 8
  },
  groups: {
    FILES: 1,
    PROGRAMS: 2,
    SETTINGS: 3
  }
}).build();

const filePermission = autoPermask.for('FILES')
  .grant(['READ', 'WRITE'])
  .value();

console.log('Auto-assigned Permission Details:', autoPermask.check(filePermission).explain());
console.log('Permission Values:');
console.log('- READ:', autoPermask.getPermissionValue('READ'));
console.log('- WRITE:', autoPermask.getPermissionValue('WRITE'));
console.log('- EXECUTE:', autoPermask.getPermissionValue('EXECUTE'));
console.log('- CONFIGURE:', autoPermask.getPermissionValue('CONFIGURE'));
console.log('- ALL:', autoPermask.getPermissionValue('ALL'));

