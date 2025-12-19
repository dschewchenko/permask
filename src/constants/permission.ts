/**
 * Permission access enum. 4 bits.
 */
export const PermissionAccess = {
  READ: 1, // 0b0001
  CREATE: 2, // 0b0010
  UPDATE: 4, // 0b0100
  DELETE: 8 // 0b1000
} as const;

export type PermissionAccessType = keyof typeof PermissionAccess;
export type PermissionAccessBits = (typeof PermissionAccess)[PermissionAccessType];

/**
 * Predefined permission access bitmasks.
 */
export const PermissionAccessBitmasks = {
  FULL: 15, // 0b1111 - read, create, update, delete
  CREATE: 3, // 0b0011 - read, create
  READ: 1 // 0b0001 - read-only
} as const;
