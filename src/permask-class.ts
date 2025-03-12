import { ACCESS_BITS, ACCESS_MASK } from "./constants/bitmask";
import { PermissionAccess } from "./constants/permission";
import {
  canDelete,
  canRead,
  canWrite,
  hasPermissionAccess
} from "./utils/bitmask";

/**
 * Flexible permission management system that allows custom permission definitions,
 * bit allocations and groups.
 */
export class Permask<T extends Record<string, number> = Record<string, number>> {
  private permissions: T;
  private accessBits: number;
  private accessMask: number;
  private groups: Record<string, number>;
  
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
  }
  
  /**
   * Create a bitmask with the specified permissions and group
   */
  create(group: number | string, permissionList: (keyof T)[]): number {
    let access = 0;
    for (const permission of permissionList) {
      access |= this.permissions[permission as string] || 0;
    }
    
    const groupValue = typeof group === 'string' ? this.groups[group] || 0 : group;
    return (groupValue << this.accessBits) | access;
  }
  
  /**
   * Check if a bitmask has a specific permission
   */
  hasPermission(bitmask: number, permission: keyof T | string): boolean {
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
   * Add permission to existing bitmask without changing the group
   */
  addPermission(bitmask: number, permission: keyof T | string): number {
    const group = this.getGroup(bitmask);
    const permValue = (this.permissions as Record<string, number>)[permission as string] || 0;
    const access = (bitmask & this.accessMask) | permValue;
    return (group << this.accessBits) | access;
  }
  
  /**
   * Remove permission from existing bitmask
   */
  removePermission(bitmask: number, permission: keyof T | string): number {
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
    customPermissions?: (keyof T | string)[];
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
    return hasPermissionAccess(bitmask, PermissionAccess.READ);
  }
  
  canWrite(bitmask: number): boolean {
    return hasPermissionAccess(bitmask, PermissionAccess.WRITE);
  }
  
  canDelete(bitmask: number): boolean {
    return hasPermissionAccess(bitmask, PermissionAccess.DELETE);
  }
}
