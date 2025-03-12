import { ACCESS_BITS, ACCESS_MASK } from "./constants/bitmask";
import { PermissionAccess } from "./constants/permission";

/**
 * Special permission symbol that represents all permissions
 */
export const ALL_PERMISSIONS = Symbol('ALL_PERMISSIONS');

/**
 * Type for permission lists that can include the special ALL symbol
 */
export type PermissionList<T> = (keyof T | typeof ALL_PERMISSIONS)[];

/**
 * Flexible permission management system that allows custom permission definitions,
 * bit allocations and groups.
 */
export class Permask<T extends Record<string, number> = Record<string, number>> {
  private permissions: T;
  private accessBits: number;
  private accessMask: number;
  private groups: Record<string, number>;
  
  // Common permission combinations for convenience
  readonly FULL: number;
  readonly NONE: number;
  readonly READ_ONLY: number;
  readonly READ_WRITE: number;
  
  /**
   * Create a custom permission system
   * @param options Configuration options for the permission system
   */
  constructor(options: {
    permissions?: T; // Custom permission types with bit values
    accessBits?: number; // Number of bits allocated for permissions
    accessMask?: number; // Mask for access bits
    groups?: Record<string, number>; // Custom groups
  } = {}) {
    // Use the provided values or fall back to constants
    this.accessBits = options.accessBits || ACCESS_BITS;
    
    // For accessMask, use provided value, or calculate based on custom bits, or use the constant
    if (options.accessMask !== undefined) {
      this.accessMask = options.accessMask;
    } else if (options.accessBits !== undefined) {
      // Only recalculate if custom bits provided
      this.accessMask = (1 << this.accessBits) - 1;
    } else {
      // Otherwise use the predefined constant
      this.accessMask = ACCESS_MASK;
    }
    
    this.permissions = (options.permissions || PermissionAccess as unknown as T);
    this.groups = options.groups || {};
    
    // Validate that permissions fit within specified bits
    const maxValue = this.accessMask;
    for (const [key, value] of Object.entries(this.permissions)) {
      if (value > maxValue) {
        throw new Error(`Permission '${key}' value ${value} exceeds the maximum value ${maxValue} for ${this.accessBits} bits`);
      }
    }

    // Initialize common permission combinations
    this.FULL = this.accessMask;
    this.NONE = 0;
    this.READ_ONLY = PermissionAccess.READ;
    this.READ_WRITE = PermissionAccess.READ | PermissionAccess.WRITE;
  }
  
  /**
   * Create a bitmask with the specified permissions and group
   * @example
   * // Basic usage
   * const permission = permask.create('DOCUMENTS', ['READ', 'WRITE']);
   * 
   * // Grant all permissions
   * const fullAccess = permask.create('DOCUMENTS', [ALL_PERMISSIONS]);
   */
  create(group: number | string, permissionList: PermissionList<T>): number {
    // Check if ALL_PERMISSIONS is in the list
    if (permissionList.includes(ALL_PERMISSIONS)) {
      return this.createAllPermissions(group);
    }
    
    let access = 0;
    for (const permission of permissionList) {
      if (permission === ALL_PERMISSIONS) continue; // Just to be safe
      access |= this.permissions[permission as string] || 0;
    }
    
    const groupValue = typeof group === 'string' ? this.groups[group] || 0 : group;
    return (groupValue << this.accessBits) | access;
  }
  
  /**
   * Check if a bitmask has a specific permission
   */
  hasPermission(bitmask: number, permission: keyof T): boolean {
    const access = bitmask & this.accessMask;
    const permValue = (this.permissions as Record<string, number>)[permission as string] || 0;
    return (access & permValue) !== 0;
  }
  
  /**
   * Get permission group from bitmask
   */
  getGroup(bitmask: number): number {
    return bitmask >> this.accessBits;
  }
  
  /**
   * Get group name by group value
   */
  getGroupName(bitmask: number): string | undefined {
    const groupValue = this.getGroup(bitmask);
    const entry = Object.entries(this.groups).find(([, value]) => value === groupValue);
    return entry?.[0];
  }
  
  /**
   * Check if bitmask has the specified group
   */
  hasGroup(bitmask: number, group: number | string): boolean {
    const groupValue = typeof group === 'string' ? this.groups[group] || 0 : group;
    return this.getGroup(bitmask) === groupValue;
  }
  
  /**
   * Create a bitmask with ALL permissions for a given group
   * Acts like a wildcard (*) permission
   */
  createAllPermissions(group: number | string): number {
    const groupValue = typeof group === 'string' ? this.groups[group] || 0 : group;
    return (groupValue << this.accessBits) | this.accessMask;
  }
  
  /**
   * Check if bitmask has ALL permissions
   */
  hasAllPermissions(bitmask: number): boolean {
    const access = bitmask & this.accessMask;
    return access === this.accessMask;
  }

  /**
   * Check if bitmask has ANY permissions
   */
  hasAnyPermission(bitmask: number): boolean {
    const access = bitmask & this.accessMask;
    return access !== 0;
  }
  
  /**
   * Add permission to existing bitmask without changing the group
   */
  addPermission(bitmask: number, permission: keyof T): number {
    const group = this.getGroup(bitmask);
    const permValue = (this.permissions as Record<string, number>)[permission as string] || 0;
    const access = (bitmask & this.accessMask) | permValue;
    return (group << this.accessBits) | access;
  }
  
  /**
   * Add ALL permissions to existing bitmask without changing the group
   */
  addAllPermissions(bitmask: number): number {
    const group = this.getGroup(bitmask);
    return (group << this.accessBits) | this.accessMask;
  }
  
  /**
   * Remove permission from existing bitmask
   */
  removePermission(bitmask: number, permission: keyof T): number {
    const group = this.getGroup(bitmask);
    const permValue = (this.permissions as Record<string, number>)[permission as string] || 0;
    const access = (bitmask & this.accessMask) & ~permValue;
    return (group << this.accessBits) | access;
  }
  
  /**
   * Parse bitmask into an object with group and permissions
   */
  parse(bitmask: number): {
    group: number;
    groupName?: string;
    permissions: Partial<Record<keyof T, boolean>>;
  } {
    const group = this.getGroup(bitmask);
    const permissions = {} as Partial<Record<keyof T, boolean>>;
    
    for (const [key, value] of Object.entries(this.permissions)) {
      permissions[key as keyof T] = this.hasPermission(bitmask, key as keyof T);
    }
    
    return {
      group,
      groupName: this.getGroupName(bitmask),
      permissions
    };
  }
  
  /**
   * Register a new permission type (use with caution)
   */
  registerPermission(name: string, bitValue: number): void {
    if (bitValue > this.accessMask) {
      throw new Error(`Permission value ${bitValue} exceeds the maximum value ${this.accessMask} for ${this.accessBits} bits`);
    }
    
    (this.permissions as Record<string, number>)[name] = bitValue;
  }
  
  /**
   * Register a new group
   */
  registerGroup(name: string, value: number): void {
    this.groups[name] = value;
  }
  
  /**
   * Create compatible bitmasks that can be used with the standard utils functions
   */
  createStandardBitmask({
    group,
    read = false, 
    write = false, 
    delete: del = false,
    customPermissions = []
  }: {
    group: number | string;
    read?: boolean;
    write?: boolean;
    delete?: boolean;
    customPermissions?: (keyof T)[];
  }): number {
    const groupValue = typeof group === 'string' ? this.groups[group] || 0 : group;
    
    // Create our own bitmask instead of using the utility function that uses ACCESS_BITS
    let bitmask = 0;
    if (read) bitmask |= PermissionAccess.READ;
    if (write) bitmask |= PermissionAccess.WRITE;
    if (del) bitmask |= PermissionAccess.DELETE;
    
    // Set group using our accessBits
    bitmask |= (groupValue << this.accessBits);
    
    // Add any custom permissions
    for (const permission of customPermissions) {
      const permValue = (this.permissions as Record<string, number>)[permission as string];
      if (permValue !== undefined) {
        // Get the current access part without changing the group
        const currentAccess = bitmask & this.accessMask;
        // Add the new permission
        const newAccess = currentAccess | permValue;
        // Replace the access part in the result
        bitmask = (bitmask & ~this.accessMask) | newAccess;
      }
    }
    
    return bitmask;
  }
  
  /**
   * Compatibility methods with the standard utils
   */
  canRead(bitmask: number): boolean {
    const access = bitmask & this.accessMask;
    return (access & PermissionAccess.READ) !== 0;
  }
  
  canWrite(bitmask: number): boolean {
    const access = bitmask & this.accessMask;
    return (access & PermissionAccess.WRITE) !== 0;
  }
  
  canDelete(bitmask: number): boolean {
    const access = bitmask & this.accessMask;
    return (access & PermissionAccess.DELETE) !== 0;
  }
  
  /**
   * Get the full permission value (all bits set to 1)
   * This is equivalent to having all permissions enabled
   */
  getFullAccessValue(): number {
    return this.accessMask;
  }
  
  /**
   * Combine multiple permissions into a single bitmask value
   * Useful for creating custom composite permissions like "FULL" or "READ_WRITE"
   */
  combinePermissions(permissionNames: (keyof T)[]): number {
    let result = 0;
    for (const permission of permissionNames) {
      result |= this.permissions[permission as string] || 0;
    }
    return result;
  }
  
  /**
   * Get a map of all permission values for reference
   * Helps users understand the bit values of each permission
   */
  getPermissionValues(): Record<string, { value: number, binaryValue: string }> {
    const result: Record<string, { value: number, binaryValue: string }> = {};
    
    for (const [key, value] of Object.entries(this.permissions)) {
      // Convert to binary string with leading zeros based on bit count
      const binaryValue = value.toString(2).padStart(this.accessBits, '0');
      result[key] = { value, binaryValue };
    }
    
    // Add the FULL access value for reference
    result['FULL_ACCESS'] = {
      value: this.accessMask,
      binaryValue: this.accessMask.toString(2).padStart(this.accessBits, '0')
    };
    
    return result;
  }

  /**
   * Create a compatible bitmask that can be used with the standard utils functions
   * @example
   * // Create read-only access for group 1
   * const readOnly = permask.createAccess(1);
   * 
   * // Create full access for ADMIN group
   * const adminAccess = permask.createAccess('ADMIN', 'full');
   * 
   * // Create read-write access with custom permissions
   * const customAccess = permask.createAccess('DOCUMENTS', 'read-write', ['SHARE']);
   */
  createAccess(
    group: number | string, 
    accessType: 'full' | 'none' | 'read-only' | 'read-write' = 'read-only',
    customPermissions: (keyof T)[] = []
  ): number {
    const groupValue = typeof group === 'string' ? this.groups[group] || 0 : group;
    
    // Start with the base access type
    let bitmask = 0;
    switch (accessType) {
      case 'full':
        bitmask = this.FULL;
        break;
      case 'read-write':
        bitmask = this.READ_WRITE;
        break;
      case 'read-only':
        bitmask = this.READ_ONLY;
        break;
      case 'none':
      default:
        bitmask = this.NONE;
    }
    
    // Add group
    bitmask |= (groupValue << this.accessBits);
    
    // Add any custom permissions
    for (const permission of customPermissions) {
      const permValue = (this.permissions as Record<string, number>)[permission as string];
      if (permValue !== undefined) {
        // Get the current access part without changing the group
        const currentAccess = bitmask & this.accessMask;
        // Add the new permission
        const newAccess = currentAccess | permValue;
        // Replace the access part in the result
        bitmask = (bitmask & ~this.accessMask) | newAccess;
      }
    }
    
    return bitmask;
  }
  
  // Simplified version of createStandardBitmask
  /**
   * Create standard permissions with a simpler interface
   * @example
   * // Read-only access
   * const readOnly = permask.grant({
   *   group: 'DOCUMENTS',
   *   read: true
   * });
   * 
   * // Full access
   * const fullAccess = permask.grant({
   *   group: 'ADMIN',
   *   all: true
   * });
   */
  grant({
    group,
    all = false,
    read = false, 
    write = false, 
    delete: del = false,
    permissions = []
  }: {
    group: number | string;
    all?: boolean;
    read?: boolean;
    write?: boolean;
    delete?: boolean;
    permissions?: (keyof T)[];
  }): number {
    if (all) {
      return this.createAllPermissions(group);
    }
    
    return this.createStandardBitmask({
      group,
      read,
      write,
      delete: del,
      customPermissions: permissions
    });
  }
}
