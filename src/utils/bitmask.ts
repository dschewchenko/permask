import { ACCESS_BITS, ACCESS_MASK } from "../constants/bitmask";
import { PermissionAccess } from "../constants/permission";

/**
 * Permission mask:
 * - 3 bits for access
 * - any number of bits for group
 * {group(0,...)}{access(3)}
 */

/**
 * Set permission access in bitmask.
 * Use to override access.
 */
export function setPermissionAccess(bitmask: number, access: number) {
  return (bitmask & ~ACCESS_MASK) | access;
}

/**
 * Add permission access to bitmask.
 * Will not override existing access.
 */
export function addPermissionAccess(bitmask: number, access: number) {
  return bitmask | access;
}

/**
 * Set permission group in bitmask.
 * Use to override group.
 */
export function setPermissionGroup(bitmask: number, group: number) {
  return getPermissionAccess(bitmask) | (group << ACCESS_BITS);
}

/**
 * Get permission group from mask.
 */
export function getPermissionGroup(bitmask: number): number {
  return bitmask >> ACCESS_BITS;
}

/**
 * Get permission access from bitmask.
 */
export function getPermissionAccess(bitmask: number): number {
  return bitmask & ACCESS_MASK;
}

/**
 * Check if permission bitmask has given group.
 */
export function hasPermissionGroup(bitmask: number, group: number) {
  return getPermissionGroup(bitmask) === group;
}

/**
 * Check if permission bitmask has given access.
 */
export function hasPermissionAccess(bitmask: number, access: number) {
  return (getPermissionAccess(bitmask) & access) !== 0;
}

/**
 * Get permission bitmask from given group and access. {group(1,...)}{access(010)}
 */
export function getPermissionBitmask(group: number, access: number) {
  return (group << ACCESS_BITS) | access;
}

/**
 * Check if permission bitmask has read, create or delete access.
 * Just fancy way to check permission.
 */
export function canRead(bitmask: number) {
  return hasPermissionAccess(bitmask, PermissionAccess.READ);
}

export function canCreate(bitmask: number) {
  return hasPermissionAccess(bitmask, PermissionAccess.CREATE);
}

export function canDelete(bitmask: number) {
  return hasPermissionAccess(bitmask, PermissionAccess.DELETE);
}

/**
 * Checks if a bitmask has update permission.
 */
export function canUpdate(bitmask: number): boolean {
  return hasPermissionAccess(bitmask, PermissionAccess.UPDATE);
}

/**
 * Array methods for checking permission.
 *
 * @example
 * const bitmask = [0b1111, 0b11101, 0b011];
 *
 * const canReadPosts = hasRequiredPermission(bitmasks, PermissionGroup.Post, PermissionAccess.READ);
 */
export function hasRequiredPermission(bitmasks: number[], group: number, access: number) {
  return bitmasks.some((bitmask) => hasPermissionGroup(bitmask, group) && hasPermissionAccess(bitmask, access));
}

/**
 * Return object with permission group and access from bitmask.
 */
export function parseBitmask(bitmask: number): {
  group: number;
  read: boolean;
  create: boolean;
  delete: boolean;
  update: boolean;
} {
  const group = getPermissionGroup(bitmask);
  const access = getPermissionAccess(bitmask);
  return {
    group,
    read: (access & PermissionAccess.READ) === PermissionAccess.READ,
    create: (access & PermissionAccess.CREATE) === PermissionAccess.CREATE,
    delete: (access & PermissionAccess.DELETE) === PermissionAccess.DELETE,
    update: (access & PermissionAccess.UPDATE) === PermissionAccess.UPDATE
  };
}

/**
 * Create permission bitmask from group and access.
 */
export function createBitmask({
  group,
  read = false,
  create = false,
  delete: del = false,
  update = false
}: {
  group: number;
  read?: boolean;
  create?: boolean;
  delete?: boolean;
  update?: boolean;
}) {
  let bitmask = 0;
  if (read) bitmask = addPermissionAccess(bitmask, PermissionAccess.READ);
  if (create) bitmask = addPermissionAccess(bitmask, PermissionAccess.CREATE);
  if (del) bitmask = addPermissionAccess(bitmask, PermissionAccess.DELETE);
  if (update) bitmask = addPermissionAccess(bitmask, PermissionAccess.UPDATE);
  bitmask = setPermissionGroup(bitmask, group);

  return bitmask;
}
