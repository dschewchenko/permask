/**
 * Permission access enum. 4 bits.
 */
export const PermissionAccess = {
  READ: 1, // 0b001
  WRITE: 2, // 0b010
  DELETE: 4, // 0b100
  UPDATE: 8, // 0b1000
} as const;

export type PermissionAccessType = keyof typeof PermissionAccess;

/**
 * Predefined permission access bitmasks.
 */
export const PermissionAccessBitmasks = {
  FULL: 15, // 0b1111 - read, write, delete, update
  WRITE: 3, // 0b011 - read, write
  READ: 1 // 0b001 - read-only
} as const;
