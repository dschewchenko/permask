# permask [![npm](https://img.shields.io/npm/v/permask.svg)](https://www.npmjs.com/package/permask) [![build status](https://github.com/dschewchenko/permask/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/dschewchenko/permask/actions/workflows/release.yml) [![Download](https://img.shields.io/npm/dm/permask)](https://www.npmjs.com/package/permask)


A lightweight TypeScript library for managing permissions using bitmasks.
Using just utility functions will be even smaller with tree-shaking.

## What are bitmasks?

Bitmasks are a way to store multiple boolean values in a single integer.
They are useful for managing permissions, flags or groups.

For example in UNIX file systems, bitmasks are used to manage file permissions (read, write, execute) for users, groups and others. Like 777 for full access to everyone, 755 for read and execute access to everyone, but full access to the owner.


## Why use bitmasks?

- Fast: Bitwise operations (&, |) are faster than comparing strings.
- Compact: Combine multiple permissions in a single integer (e.g., 0b1111 for read, create, update, delete).
  Just 4 bits for access control. For groups, you can use any number of bits,
- Flexible: Easy to check, add or remove permissions.

Example of using bitmasks:

```ts
const READ = 1;   // 0b0001
const CREATE = 2;  // 0b0010
const UPDATE = 4; // 0b0100
const DELETE = 8; // 0b1000

const userPermissions = READ | CREATE | UPDATE; // 0b0111
const canRead = (userPermissions & READ) === READ;     // true
const canCreate = (userPermissions & CREATE) === CREATE;   // true
const canUpdate = (userPermissions & UPDATE) === UPDATE; // true
const canDelete = (userPermissions & DELETE) === DELETE; // false
```

## Bitmask in permask structure

```
[ Group (0–29 bits) | Permissions (4 bits) ]

  0b0001_0111 = 23
    \__/ \__/
     /     \
Group(1)  Permissions(read, create, update)
```


## Installation

Install `permask`:

```bash
# bun
bun add permask
# npm
npm install permask
# pnpm
pnpm add permask
# yarn
yarn add permask
```


## 🎮 Playground

Try out `permask` interactively! [Live Demo](https://dschewchenko.github.io/permask/)


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
console.log(permask.create({
  group: "LIKE",
  read: true,
  create: false,
  update: true,
  delete: false
})); // 53 (0b110101)
```

- #### parse a bitmask to an object:
```ts
console.log(permask.parse(31)); // 0b11111
// {
//   group: 1,
//   groupName: "POST",
//   read: true,
//   create: true,
//   update: true,
//   delete: true
// }
```

- #### check if a bitmask has a specific group:

```ts
console.log(permask.hasGroup(23, "LIKE")); // true
// You can also use numeric group IDs
const hasGroupById = permask.hasGroup(23, PermissionGroup.LIKE);
```

- #### check if a bitmask has a specific permission:
```ts
console.log(
  permask.canRead(17),
  permask.canCreate(17),
  permask.canDelete(17),
  permask.canUpdate(17)
); // true, false, false, false
```

- #### check if a bitmask has access to a specific group and permission:
```ts
import { PermissionAccess } from "permask";

// Check if bitmask has read access to LIKE group using string access
console.log(permask.hasAccess(53, "LIKE", "read")); // true

// Check if bitmask has create access to LIKE group using string access
console.log(permask.hasAccess(53, "LIKE", "create")); // false

// You can also use numeric group IDs with string access
console.log(permask.hasAccess(53, PermissionGroup.LIKE, "update")); // true

// You can use numeric access values (PermissionAccess) instead of strings
const hasUpdateAccessNumeric = permask.hasAccess(53, PermissionGroup.LIKE, PermissionAccess.UPDATE);
console.log(hasUpdateAccessNumeric); // true
```

- #### get group name from bitmask:
```ts
console.log(permask.getGroupName(23)); // "LIKE"
console.log(permask.getGroupName(29)); // undefined
```


## Bonus:

You can use `permask` just with bitmask utility functions.

*But it will be without some types dependent on your groups.*

### Use bitmask utilities:

#### `access` name vs `access` mask

- **Access name**: `"read" | "create" | "update" | "delete"` (used in `createPermask().hasAccess(...)`).
- **Access mask**: a number made from `PermissionAccess` flags (used in low-level utils), e.g. `PermissionAccess.READ | PermissionAccess.UPDATE`.

**Functions:**
- `createBitmask({ group: number, read: boolean, create: boolean, delete: boolean, update: boolean }): number` - creates a bitmask from an options.
- `parseBitmask(bitmask: number): { group: number, read: boolean, create: boolean, delete: boolean, update: boolean }` - parses a bitmask and returns an object.
- `getPermissionGroup(bitmask: number): number` - returns a group number from a bitmask.
- `getPermissionAccess(bitmask: number): number` - returns an access mask (4 bits) from a bitmask.
- `hasPermissionGroup(bitmask: number, group: number): boolean` - checks if a bitmask has a specific group.
- `hasPermissionAccess(bitmask: number, accessMask: number): boolean` - checks if a bitmask has **any** access flag from `accessMask`.
- `hasAllPermissionAccess(bitmask: number, accessMask: number): boolean` - checks if a bitmask has **all** access flags from `accessMask`.
- `hasRequiredPermission(bitmasks: number[], group: number, accessMask: number): boolean` - checks if any bitmask has the required group and **any** access flag from `accessMask`.

  useful functions:
  - `canRead(bitmask: number): boolean`
  - `canCreate(bitmask: number): boolean`
  - `canDelete(bitmask: number): boolean`
  - `canUpdate(bitmask: number): boolean`
- `setPermissionGroup(bitmask: number, group: number): number` - sets a group in a bitmask (will overwrite the previous group).
- `setPermissionAccess(bitmask: number, accessMask: number): number` - sets access mask (will overwrite the previous access).
- `removePermissionAccess(bitmask: number, accessMask: number): number` - removes access flags from a bitmask.
- `togglePermissionAccess(bitmask: number, accessMask: number): number` - toggles access flags in a bitmask.
- `clearPermissionAccess(bitmask: number): number` - clears all access flags in a bitmask.
- `getPermissionBitmask(group: number, accessMask: number): number` - creates a bitmask from a group and an access mask.
- `packBitmasks(bitmasks: number[], urlSafe?: boolean): string` - packs bitmasks to base64 string (more compact than JSON.stringify).
- `unpackBitmasks(packed: string, urlSafe?: boolean): number[]` - unpacks bitmasks from a packed string (throws `PermaskError` on invalid input).
- `formatBitmask(bitmask: number, groups?: Record<string, number>): string` - formats a bitmask into a readable string for logging/debugging.

**Constants:**
- `PermissionAccess` - an enum-like object with access types.
  ```ts
  const PermissionAccess = {
      READ: 1,    // 0b0001
      CREATE: 2,   // 0b0010
      UPDATE: 4,  // 0b0100
      DELETE: 8   // 0b1000
  } as const;
  ```
- `PermissionAccessBitmasks` - full access bitmask for usual cases.
  ```ts
  const PermissionAccessBitmasks = {
      FULL: 0b1111,  // read, create, update, delete
      CREATE: 0b0011, // read, create
      READ: 0b0001   // read-only
  } as const;
  ```

## Integrations

Framework integrations are published as subpath exports (ESM-only). See [src/integrations/README.md](src/integrations/README.md).

- Express: `import { permaskExpress } from "permask/express";`
- Fastify: `import { permaskFastify } from "permask/fastify";`
- H3: `import { permaskH3 } from "permask/h3";`
- Nitro: `import { permaskNitro } from "permask/nitro";`
- NestJS: `import { permaskNestjs } from "permask/nestjs";`
- Hono: `import { permaskHono } from "permask/hono";`
- Koa: `import { permaskKoa } from "permask/koa";`
- itty-router: `import { permaskIttyRouter } from "permask/itty-router";`
- Elysia: `import { permaskElysia } from "permask/elysia";`

## How I'm using it?

I'm using `permask` in my projects to manage permissions for users. It's easy to use and understand. And that's why I decided to share it with you.

For example, I'm storing bitmask permissions array in access tokens for users. It's easy to check if user has access to a specific functionality or group.

It's possible to store ~820 bitmask permissions(1 group + 3 access) in 1kB. In JS - 128 bitmasks, because each number in JS weights 4bytes

With strings like `Posts.Read`, `Users.Create` it will be just ~35 permissions (1 group + 1 access)


## Enjoy!

If you have any questions or suggestions, feel free to open an issue or pull request.


## Roadmap

- [x] Create a library
- [x] Add tests
- [x] Add documentation
- [x] Add easy-to-use integration with frameworks (subpath exports, ESM-only)
  - [x] Express (`permask/express`) — Express middleware
  - [x] Fastify (`permask/fastify`) — `preHandler` hook (works well with `@fastify/auth`)
  - [x] H3 (`permask/h3`) — `requirePermask(event, ...)` + middleware
  - [x] Nitro (`permask/nitro`) — H3-based helpers + handler wrapper
  - [x] NestJS (`permask/nestjs`) — Decorator + Guard
  - [x] Hono (`permask/hono`) — middleware (context-based)
  - [x] Koa (`permask/koa`) — async middleware (typically via `ctx.state`)
  - [x] itty-router (`permask/itty-router`) — handler / `before` middleware returning `Response`
  - [x] Elysia (`permask/elysia`) — `beforeHandle` helper (usable inside `guard`)


## License

[MIT](https://opensource.org/licenses/MIT)

Copyright (c) 2025 by [Dmytro Shevchenko](https://github.com/dschewchenko)
