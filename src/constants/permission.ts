/**
 * Permission access enum. 3 bits.
 */
export const PermissionAccess = {
  READ: 1, // 0b001
  WRITE: 2, // 0b010
  DELETE: 4 // 0b100
} as const;

export type PermissionAccessType = keyof typeof PermissionAccess;

/**
 * Predefined permission access bitmasks.
 */
export const PermissionAccessBitmasks = {
  FULL: 7, // 0b111
  WRITE: 3, // 0b011
  READ: 1 // 0b001
} as const;
