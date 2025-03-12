import { Permask } from 'permask';

// Example 1: Using default permissions (READ, WRITE, DELETE)
const defaultPermissions = new Permask();

// Create a permission bitmask for group 1 with read and write access
const userPermission = defaultPermissions.createStandardBitmask({
  group: 1,
  read: true,
  write: true
});

console.log('User Permission:', defaultPermissions.parse(userPermission));
console.log('Can Read:', defaultPermissions.canRead(userPermission)); // true
console.log('Can Write:', defaultPermissions.canWrite(userPermission)); // true
console.log('Can Delete:', defaultPermissions.canDelete(userPermission)); // false

// Example 2: Custom permissions with named groups
const customPermissions = new Permask({
  permissions: {
    VIEW: 1,        // 0b001
    EDIT: 2,        // 0b010
    DELETE: 4,      // 0b100
    SHARE: 8,       // 0b1000
    PRINT: 16,      // 0b10000
    DOWNLOAD: 32,   // 0b100000
    ADMIN: 64,       // 0b1000000
    ENCRYPT: 128    // 0b10000000
  },
  accessBits: 8,    // We need 7 bits for our permissions
  groups: {
    DOCUMENTS: 1,
    PHOTOS: 2,
    VIDEOS: 3,
    FILES: 4,
    ADMIN: 100
  }
});

// Create permissions for a document editor
const editorPermission = customPermissions.create('DOCUMENTS', ['VIEW', 'EDIT', 'SHARE']);
console.log('Editor Permission:', customPermissions.parse(editorPermission));

// Check specific permissions
console.log('Can View:', customPermissions.hasPermission(editorPermission, 'VIEW')); // true
console.log('Can Delete:', customPermissions.hasPermission(editorPermission, 'DELETE')); // false

// Add a permission
const enhancedPermission = customPermissions.addPermission(editorPermission, 'PRINT');
console.log('Enhanced Permission:', customPermissions.parse(enhancedPermission));

// Remove a permission
const reducedPermission = customPermissions.removePermission(enhancedPermission, 'SHARE');
console.log('Reduced Permission:', customPermissions.parse(reducedPermission));

// Check group
console.log('Is Document Group:', customPermissions.hasGroup(editorPermission, 'DOCUMENTS')); // true
console.log('Is Photo Group:', customPermissions.hasGroup(editorPermission, 'PHOTOS')); // false
console.log('Group Name:', customPermissions.getGroupName(editorPermission)); // "DOCUMENTS"

// Register a new permission at runtime
customPermissions.registerPermission('ENCRYPT', 128);
const securePermission = customPermissions.addPermission(editorPermission, 'ENCRYPT');
console.log('Secure Permission:', customPermissions.parse(securePermission));

// Register a new group at runtime
customPermissions.registerGroup('SECURE_DOCS', 101);
const secureDocPermission = customPermissions.create('SECURE_DOCS', ['VIEW', 'EDIT', 'ENCRYPT']);
console.log('Secure Doc Permission:', customPermissions.parse(secureDocPermission));

// Example 3: Using the Permask class with different bits configuration
const tinyPermissions = new Permask({
  permissions: {
    READ_ONLY: 1,  // 0b01
    FULL: 3        // 0b11
  },
  accessBits: 2,   // Only using 2 bits for permissions
  groups: {
    PUBLIC: 1,
    PRIVATE: 2
  }
});

const publicReadOnly = tinyPermissions.create('PUBLIC', ['READ_ONLY']);
console.log('Public Read Only:', tinyPermissions.parse(publicReadOnly));
console.log('Group:', tinyPermissions.getGroup(publicReadOnly));

