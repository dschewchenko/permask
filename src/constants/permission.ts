/**
 * Permission access enum. 4 bits.
 */
export const PermissionAccess = {
  READ: 1,   // 0b0001
  CREATE: 2,  // 0b0010
  UPDATE: 4, // 0b0100
  DELETE: 8, // 0b1000
} as const;

export type PermissionAccessType = keyof typeof PermissionAccess;

/**
 * Predefined permission access bitmasks.
 */
export const PermissionAccessBitmasks = {
  FULL: 15,       // 0b1111 - read, create, update, delete
  READ_CREATE: 3, // 0b0011 - read, create
  READ_UPDATE: 5, // 0b0101 - read, update
  READ_DELETE: 9, // 0b1001 - read, delete
} as const;
