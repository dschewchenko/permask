# Permask Usage Guide

Permask is a flexible permission management system with a fluent API. This guide provides examples of how to use the library for common permission management scenarios.

## Table of Contents
- [Basic Setup](#basic-setup)
- [Creating Permissions](#creating-permissions)
- [Checking Permissions](#checking-permissions)
- [Permission Sets](#permission-sets)
- [String Conversion](#string-conversion)
- [Custom Permissions](#custom-permissions)
- [Advanced Usage](#advanced-usage)

## Basic Setup

### Simple CRUD Permissions

```typescript
import { DefaultPermissionAccess, PermaskBuilder } from './permask-class';

// Create a permask instance with default CRUD permissions
const permask = new PermaskBuilder({
  permissions: DefaultPermissionAccess,
  groups: {
    USERS: 1,
    DOCUMENTS: 2,
    PHOTOS: 3
  }
}).build();
```

### Custom Permissions

```typescript
import { PermaskBuilder } from './permask-class';

// Define custom permissions
const permask = new PermaskBuilder<{
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
}).build();
```

### Auto-assigned Permission Values

```typescript
import { PermaskBuilder } from './permask-class';

// Let the library auto-assign bit values to permissions
const permask = new PermaskBuilder<{
  VIEW: number;
  EDIT: number;
  DELETE: number;
  SHARE: number;
}>({
  permissions: {
    VIEW: null,      // Will be assigned 1
    EDIT: null,      // Will be assigned 2
    DELETE: null,    // Will be assigned 4
    SHARE: null,     // Will be assigned 8
  },
  accessBits: 5,
  groups: {
    DOCUMENTS: 1,
    PHOTOS: 2
  }
}).build();
```

## Creating Permissions

### Basic Permission Creation

```typescript
// Create a permission for a user to view and edit documents
const documentPermission = permask.for('DOCUMENTS')
  .grant(['VIEW', 'EDIT'])
  .value();

// Create a permission for a user to view photos
const photoPermission = permask.for('PHOTOS')
  .grant(['VIEW'])
  .value();

// Using numeric group IDs
const spreadsheetPermission = permask.for(4) // SPREADSHEETS group
  .grant(['VIEW', 'EDIT', 'SHARE'])
  .value();
```

### Creating All-Access Permissions

```typescript
// Grant all possible permissions for documents
const fullDocumentAccess = permask.for('DOCUMENTS')
  .grantAll()
  .value();

// Alternative using ALL permission
const fullPhotoAccess = permask.for('PHOTOS')
  .grant(['ALL'])
  .value();
```

## Checking Permissions

### Basic Permission Checking

```typescript
// Check if the user can view documents
if (permask.check(userPermission).can('VIEW')) {
  // Allow viewing
}

// Check if the user can edit documents
if (permask.check(userPermission).can('EDIT')) {
  // Allow editing
}

// Check if the user is in the DOCUMENTS group
if (permask.check(userPermission).inGroup('DOCUMENTS')) {
  // This is a document-related permission
}
```

### Multiple Permission Checks

```typescript
// Check if user has both VIEW and EDIT permissions
if (permask.check(userPermission).canAll(['VIEW', 'EDIT'])) {
  // Allow both viewing and editing
}

// Check if user has either VIEW or EDIT permission
if (permask.check(userPermission).canAny(['VIEW', 'EDIT'])) {
  // Allow either viewing or editing
}

// Check if user has all possible permissions
if (permask.check(userPermission).canEverything()) {
  // User has all permissions
}
```

### CRUD-Specific Checks

```typescript
// Using default CRUD permissions
if (permask.check(userPermission).canCreate()) {
  // Allow creation
}

if (permask.check(userPermission).canRead()) {
  // Allow reading
}

if (permask.check(userPermission).canUpdate()) {
  // Allow updating
}

if (permask.check(userPermission).canDelete()) {
  // Allow deletion
}
```

### Getting Detailed Permission Information

```typescript
// Get a detailed explanation of permissions
const details = permask.check(userPermission).explain();

console.log(details);
// Example output:
// {
//   group: 2,
//   groupName: "PHOTOS",
//   permissions: {
//     VIEW: true,
//     EDIT: true,
//     DELETE: false,
//     SHARE: false,
//     PRINT: false,
//     ALL: false
//   }
// }
```

## Permission Sets

### Defining Permission Sets

```typescript
// Define permission sets during initialization
const permask = new PermaskBuilder<{
  VIEW: number;
  EDIT: number;
  DELETE: number;
  SHARE: number;
  PRINT: number;
}>({
  permissions: {
    // ... permissions definition
  },
  // ... other options
})
.definePermissionSet('VIEWER', ['VIEW'])
.definePermissionSet('EDITOR', ['VIEW', 'EDIT'])
.definePermissionSet('MANAGER', ['VIEW', 'EDIT', 'DELETE'])
.definePermissionSet('ADMIN', ['VIEW', 'EDIT', 'DELETE', 'SHARE', 'PRINT'])
.build();
```

### Using Permission Sets

```typescript
// Grant permissions using predefined sets
const viewerPermission = permask.for('DOCUMENTS')
  .grantSet('VIEWER')
  .value();

const editorPermission = permask.for('DOCUMENTS')
  .grantSet('EDITOR')
  .value();

const managerPermission = permask.for('DOCUMENTS')
  .grantSet('MANAGER')
  .value();

// Combine permission sets with additional permissions
const customPermission = permask.for('DOCUMENTS')
  .grantSet('EDITOR')
  .grant(['SHARE'])
  .value();
```

## String Conversion

### Converting Permissions to Strings

```typescript
// Convert permissions to strings for storage
const permissionString = permask.toString(userPermission);

console.log(permissionString);
// Example outputs:
// "DOCUMENTS:VIEW,EDIT"
// "PHOTOS:ALL"
// "VIDEOS:NONE"
```

### Converting Strings to Permissions

```typescript
// Parse permission strings back to numeric values
const docPermission = permask.fromString('DOCUMENTS:VIEW,EDIT');
const photoPermission = permask.fromString('PHOTOS:ALL');
const videoPermission = permask.fromString('VIDEOS:MANAGER');

// Using numeric group IDs
const customPermission = permask.fromString('5:VIEW,SHARE');

// Alternative formats
const allPermission = permask.fromString('DOCUMENTS:*');
const noPermission = permask.fromString('VIDEOS:');
```

## Custom Permissions

### Extending Permissions

```typescript
// Create extended version of the permissions system
const extendedPermask = permask.toBuilder()
  .definePermission('APPROVE', 32)
  .defineGroup('REPORTS', 5)
  .definePermissionSet('APPROVER', ['VIEW', 'APPROVE'])
  .build();

// Use the new components
const reportPermission = extendedPermask.for('REPORTS')
  .grantSet('APPROVER')
  .value();
```

## Advanced Usage

### Combining Multiple Permissions

```typescript
// User may have separate permissions for different resource types
const userPermissions = {
  documents: permask.for('DOCUMENTS').grantSet('EDITOR').value(),
  photos: permask.for('PHOTOS').grantSet('VIEWER').value(),
  videos: permask.for('VIDEOS').grant(['VIEW', 'SHARE']).value()
};

// Check permissions for specific resources
function checkDocumentAccess(action) {
  const perm = userPermissions.documents;
  
  switch(action) {
    case 'view':
      return permask.check(perm).can('VIEW');
    case 'edit':
      return permask.check(perm).can('EDIT');
    case 'delete':
      return permask.check(perm).can('DELETE');
    default:
      return false;
  }
}
```

### Role-Based Access Control

```typescript
// Define roles as permission sets
const rolePermissions = {
  user: permask.for('DOCUMENTS').grantSet('VIEWER').value(),
  editor: permask.for('DOCUMENTS').grantSet('EDITOR').value(),
  admin: permask.for('DOCUMENTS').grantAll().value()
};

// Assign roles to users
const users = {
  'alice': { name: 'Alice', role: 'admin' },
  'bob': { name: 'Bob', role: 'editor' },
  'charlie': { name: 'Charlie', role: 'user' }
};

// Check if a user can perform an action
function canUserPerform(username, action) {
  const user = users[username];
  if (!user) return false;
  
  const permission = rolePermissions[user.role];
  if (!permission) return false;
  
  switch(action) {
    case 'view':
      return permask.check(permission).can('VIEW');
    case 'edit':
      return permask.check(permission).can('EDIT');
    case 'delete':
      return permask.check(permission).can('DELETE');
    default:
      return false;
  }
}

// Example usage
console.log(canUserPerform('alice', 'delete')); // true (admin can delete)
console.log(canUserPerform('bob', 'edit'));     // true (editor can edit)
console.log(canUserPerform('charlie', 'edit')); // false (user cannot edit)
```

### Resource-Based Permissions

```typescript
// Define permissions for specific resource IDs
function getResourcePermission(resourceType, resourceId, userId) {
  // This would typically come from a database
  const resourcePermissions = {
    // Format: [resourceType:resourceId:userId] -> permission
    'document:123:alice': permask.for('DOCUMENTS').grantAll().value(),
    'document:123:bob': permask.for('DOCUMENTS').grantSet('EDITOR').value(),
    'document:456:bob': permask.for('DOCUMENTS').grantSet('VIEWER').value(),
  };
  
  const key = `${resourceType}:${resourceId}:${userId}`;
  return resourcePermissions[key] || permask.for('DOCUMENTS').grant([]).value(); // No permissions by default
}

// Check if a user can perform an action on a specific resource
function canAccessResource(userId, resourceType, resourceId, action) {
  const permission = getResourcePermission(resourceType, resourceId, userId);
  
  switch(action) {
    case 'view':
      return permask.check(permission).can('VIEW');
    case 'edit':
      return permask.check(permission).can('EDIT');
    case 'delete':
      return permask.check(permission).can('DELETE');
    case 'share':
      return permask.check(permission).can('SHARE');
    default:
      return false;
  }
}

// Example usage
console.log(canAccessResource('alice', 'document', '123', 'delete')); // true
console.log(canAccessResource('bob', 'document', '123', 'edit'));     // true
console.log(canAccessResource('bob', 'document', '456', 'edit'));     // false
```

### Persisting Permissions

```typescript
// Store permissions in a database
function saveUserPermissions(userId, permissions) {
  // Convert permissions to strings for storage
  const serializedPermissions = {};
  
  for (const [resource, permission] of Object.entries(permissions)) {
    serializedPermissions[resource] = permask.toString(permission);
  }
  
  // In a real application, you would save this to a database
  console.log(`Saving permissions for user ${userId}:`, serializedPermissions);
  return serializedPermissions;
}

// Retrieve and parse permissions from storage
function loadUserPermissions(userId, serializedPermissions) {
  // In a real application, you would load this from a database
  const permissions = {};
  
  for (const [resource, permissionString] of Object.entries(serializedPermissions)) {
    permissions[resource] = permask.fromString(permissionString);
  }
  
  return permissions;
}

// Example usage
const userPermissions = {
  documents: permask.for('DOCUMENTS').grantSet('EDITOR').value(),
  photos: permask.for('PHOTOS').grantSet('VIEWER').value()
};

const serialized = saveUserPermissions('alice', userPermissions);
// Example output: { documents: 'DOCUMENTS:VIEW,EDIT', photos: 'PHOTOS:VIEW' }

const loadedPermissions = loadUserPermissions('alice', serialized);
// loadedPermissions will contain the numeric bitmask values
```
