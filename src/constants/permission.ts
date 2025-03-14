/**
 * Permission access enum. 4 bits.
 */
export const PermissionAccess = {
  READ: 1,   // 0b0001
  WRITE: 2,  // 0b0010
  UPDATE: 4, // 0b0100
  DELETE: 8, // 0b1000
} as const;

export type PermissionAccessType = keyof typeof PermissionAccess;

/**
 * Predefined permission access bitmasks.
 */
export const PermissionAccessBitmasks = {
  FULL: 15, // 0b1111 - read, write, update, delete
  WRITE: 3, // 0b0011 - read, write
  READ: 1   // 0b0001 - read-only
} as const;
