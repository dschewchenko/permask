# permask [![npm](https://img.shields.io/npm/v/permask.svg)](https://www.npmjs.com/package/permask) [![build status](https://github.com/dschewchenko/permask/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/dschewchenko/permask/actions/workflows/release.yml) [![Download](https://img.shields.io/npm/dm/permask)](https://www.npmjs.com/package/permask)


A lightweight TypeScript library for managing permissions using bitmasks.
Using just utility functions will be even smaller with tree-shaking.

## What are bitmasks?

Bitmasks are a way to store multiple boolean values in a single integer.
They are useful for managing permissions, flags or groups.

For example in UNIX file systems, bitmasks are used to manage file permissions (read, write, execute) for users, groups and others. Like 777 for full access to everyone, 755 for read and execute access to everyone, but full access to the owner.


## Why use bitmasks?

- Fast: Bitwise operations (&, |) are faster than comparing strings.
- Compact: Combine multiple permissions in a single integer (e.g., 0b111 for read, write, delete).
  Just 3 bits for access control. For groups, you can use any number of bits,
- Flexible: Easy to check, add, or remove permissions.

Example of using bitmasks:

```ts
const READ = 1;   // 0b0001
const WRITE = 2;  // 0b0010
const DELETE = 4; // 0b0100
const UPDATE = 8; // 0b1000

const userPermissions = READ | WRITE | UPDATE; // 0b1011
const canRead = (userPermissions & READ) === READ;     // true
const canWrite = (userPermissions & WRITE) === WRITE;   // true
const canDelete = (userPermissions & DELETE) === DELETE; // false
const canUpdate = (userPermissions & UPDATE) === UPDATE; // true
```

## Bitmask in permask structure

```
[ Group (0–29 bits) | Permissions (3 bits) ]

  0b0001_0111 = 17
    \__/ \__/
     /     \
Group(2)  Permissions(read, write, delete)
```


## Installation

Install `permask`:

```bash
# npm
npm install permask
# pnpm
pnpm add permask
# yarn
yarn add permask
```


## How to use `permask`?

### 1. Define groups of permissions:

```ts
// examples
// with object
const PermissionGroup = {
  POST: 1,
  COMMENT: 2,
  LIKE: 3
} as const;

```

### 2. Initialize permask

```ts
import { createPermask } from "permask";
import { PermissionGroup } from "./permission-group"; // your defined groups

const permask = createPermask(PermissionGroup);
```

### 3. Use it

- #### create a bitmask from an object:
```ts
const bitmask2 = permask.create({
  group: GroupEnum.LIKE,
  read: true,
  write: false,
  delete: false,
  update: true
});
console.log(bitmask2); // 25 (0b11001)
```

- #### parse a bitmask to an object:
```ts
const parsed = permask.parse(31); // 0b11111
console.log(parsed); // { group: 2, read: true, write: true, delete: true, update: true }
```

- #### check if a bitmask has a specific group:

```ts
const hasGroup = permask.hasGroup(23, PermissionGroup.LIKE);
console.log(hasGroup); // true
```

- #### check if a bitmask has a specific permission:
```ts
const canRead = permask.canRead(17);
const canWrite = permask.canWrite(17);
const canDelete = permask.canDelete(17);
const canUpdate = permask.canUpdate(17);
console.log(canRead, canWrite, canDelete, canUpdate); // true, false, false, false
```

- #### get group name from bitmask:
```ts
const groupName = permask.getGroupName(23);
console.log(groupName); // "LIKE"
const groupName2 = permask.getGroupName(29);
console.log(groupName2); // undefined
```


## Bonus:

You can use `permask` just with bitmask utility functions.

*But it will be without some types dependent on your groups.*

### Use bitmask utilities:

**Functions:**
- `createBitmask({ group: number, read: boolean, write: boolean, delete: boolean, update: boolean }): number` - creates a bitmask from an options.
- `parseBitmask(bitmask: number): { group: number, read: boolean, write: boolean, delete: boolean, update: boolean }` - parses a bitmask and returns an object.
- `getPermissionGroup(bitmask: number): number` - returns a group number from a bitmask.
- `getPermissionAccess(bitmask: number): number` - returns an access number from a bitmask.
- `hasPermissionGroup(bitmask: number, group: number): boolean` - checks if a bitmask has a specific group.
- `hasPermissionAccess(bitmask: number, access: number): boolean` - checks if a bitmask has a specific access.

  useful functions:
  - `canRead(bitmask: number): boolean`
  - `canWrite(bitmask: number): boolean`
  - `canDelete(bitmask: number): boolean`
  - `canUpdate(bitmask: number): boolean`
- `setPermissionGroup(bitmask: number, group: number): number` - sets a group in a bitmask (will overwrite the previous group).
- `setPermissionAccess(bitmask: number, access: number): number` - sets access in a bitmask (will overwrite the previous access).
- `getPermissionBitmask(group: number, access: number): number` - creates a bitmask from a group and access.

**Constants:**
- `PermissionAccess` - an enum-like object with access types.
  ```ts
  const PermissionAccess = {
      READ: 1,    // 0b0001
      WRITE: 2,   // 0b0010
      DELETE: 4,  // 0b0100
      UPDATE: 8   // 0b1000
  } as const;
  ```
- `PermissionAccessBitmasks` - full access bitmask for usual cases.
  ```ts
  const PermissionAccessBitmasks = {
      FULL: 0b1111,  // read, write, delete, update
      WRITE: 0b0011, // read, write
      READ: 0b0001   // read-only
  } as const;
  ```

## [Integration with frameworks](https://github.com/dschewchenko/permask/blob/main/integrations/README.md)

## How I'm using it?

I'm using `permask` in my projects to manage permissions for users. It's easy to use and understand. And that's why I decided to share it with you.

For example, I'm storing bitmask permissions array in access tokens for users. It's easy to check if user has access to a specific functionality or group.

It's possible to store ~820 bitmask permissions(1 group + 3 access) in 1kB.

With strings like `Posts.Read`, `Users.Write` it will be just ~35 permissions (1 group + 1 access)


## Enjoy!

If you have any questions or suggestions, feel free to open an issue or pull request.


## Roadmap

- [x] Create a library
- [x] Add tests
- [x] Add documentation
- [ ] Add easy-to-use integration with frameworks
  - [x] Express
  - [ ] Fastify
  - [ ] H3
  - [ ] Nitro
  - [ ] NestJS
  - [ ] Hono
  - [ ] Koa
  - [ ] itty-router


## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2025 by [Dmytro Shevchenko](https://github.com/dschewchenko)
