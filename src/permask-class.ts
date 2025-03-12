/**
 * Default number of bits allocated for permissions (3 bits)
 */
const ACCESS_BITS = 3;

/**
 * Default access mask for 3 bits (0b111 = 7)
 */
const ACCESS_MASK = (1 << ACCESS_BITS) - 1;

/**
 * Default permission values
 */
const PermissionAccess = {
  READ: 1,   // 0b001
  WRITE: 2,  // 0b010
  DELETE: 4  // 0b100
} as const;

/**
 * Special symbol representing all permissions
 */
export const ALL_PERMISSIONS = Symbol('ALL_PERMISSIONS');

/**
 * Permission builder for creating and checking permissions
 */
export class PermaskBuilder<T extends Record<string, number> = Record<string, number>> {
  private permissions: T;
  private accessBits: number;
  private accessMask: number;
  private groups: Record<string, number> = {};
  private permissionSets: Record<string, Array<keyof T>> = {};
  
  constructor(options: {
    permissions?: T;
    accessBits?: number;
    accessMask?: number;
    groups?: Record<string, number>;
  } = {}) {
    this.accessBits = options.accessBits || ACCESS_BITS;
    
    if (options.accessMask !== undefined) {
      this.accessMask = options.accessMask;
    } else if (options.accessBits !== undefined) {
      this.accessMask = (1 << this.accessBits) - 1;
    } else {
      this.accessMask = ACCESS_MASK;
    }
    
    this.permissions = (options.permissions || PermissionAccess as unknown as T);
    this.groups = options.groups || {};
    
    // Validate permissions fit within specified bits
    for (const [key, value] of Object.entries(this.permissions)) {
      if (value > this.accessMask) {
        throw new Error(`Permission '${key}' value ${value} exceeds maximum value ${this.accessMask} for ${this.accessBits} bits`);
      }
    }
  }
  
  /**
   * Define a new permission
   */
  definePermission(name: string, value: number): PermaskBuilder<T & Record<string, number>> {
    if (value > this.accessMask) {
      throw new Error(`Permission value ${value} exceeds maximum value ${this.accessMask} for ${this.accessBits} bits`);
    }
    
    (this.permissions as Record<string, number>)[name] = value;
    return this as unknown as PermaskBuilder<T & Record<string, number>>;
  }
  
  /**
   * Define a new group
   */
  defineGroup(name: string, value: number): this {
    this.groups[name] = value;
    return this;
  }
  
  /**
   * Define a named set of permissions for reuse
   */
  definePermissionSet(name: string, permissions: Array<keyof T>): this {
    this.permissionSets[name] = permissions;
    return this;
  }
  
  /**
   * Build and return a Permask instance
   */
  build(): Permask<T> {
    return new Permask<T>({
      permissions: this.permissions,
      accessBits: this.accessBits,
      accessMask: this.accessMask,
      groups: this.groups,
      permissionSets: this.permissionSets
    });
  }
}

/**
 * Permission granting context for creating new permissions
 */
export class PermissionContext<T extends Record<string, number>> {
  private bitmask: number = 0;
  
  constructor(
    private permask: Permask<T>,
    group: number | string
  ) {
    const groupValue = typeof group === 'string' 
      ? permask.getGroupByName(group) || 0 
      : group;
      
    this.bitmask = groupValue << permask.accessBits;
  }
  
  /**
   * Grant specific permissions
   */
  grant(permissions: Array<keyof T | typeof ALL_PERMISSIONS>): this {
    if (permissions.includes(ALL_PERMISSIONS)) {
      this.bitmask = (this.bitmask & ~this.permask.accessMask) | this.permask.accessMask;
      return this;
    }
    
    for (const permission of permissions) {
      if (permission === ALL_PERMISSIONS) continue;
      
      const permValue = this.permask.getPermissionValue(permission);
      if (permValue) {
        const currentAccess = this.bitmask & this.permask.accessMask;
        const newAccess = currentAccess | permValue;
        this.bitmask = (this.bitmask & ~this.permask.accessMask) | newAccess;
      }
    }
    
    return this;
  }
  
  /**
   * Grant a predefined permission set
   */
  grantSet(setName: string): this {
    const permissions = this.permask.getPermissionSet(setName);
    if (permissions) {
      return this.grant(permissions);
    }
    return this;
  }
  
  /**
   * Grant full/all permissions
   */
  grantAll(): this {
    return this.grant([ALL_PERMISSIONS]);
  }
  
  /**
   * Get the resulting permission bitmask
   */
  value(): number {
    return this.bitmask;
  }
}

/**
 * Permission checking context
 */
export class PermissionCheck<T extends Record<string, number>> {
  private access: number;
  
  constructor(
    private permask: Permask<T>,
    private bitmask: number
  ) {
    this.access = bitmask & permask.accessMask;
  }
  
  /**
   * Check if has specific permission
   */
  can(permission: keyof T): boolean {
    const permValue = this.permask.getPermissionValue(permission);
    return permValue ? (this.access & permValue) !== 0 : false;
  }
  
  /**
   * Check if has all specified permissions
   */
  canAll(permissions: Array<keyof T>): boolean {
    for (const permission of permissions) {
      if (!this.can(permission)) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Check if has any of the specified permissions
   */
  canAny(permissions: Array<keyof T>): boolean {
    for (const permission of permissions) {
      if (this.can(permission)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Check if has all possible permissions
   */
  canEverything(): boolean {
    return this.access === this.permask.accessMask;
  }
  
  /**
   * Check if has standard READ permission
   */
  canRead(): boolean {
    return (this.access & PermissionAccess.READ) !== 0;
  }
  
  /**
   * Check if has standard WRITE permission
   */
  canWrite(): boolean {
    return (this.access & PermissionAccess.WRITE) !== 0;
  }
  
  /**
   * Check if has standard DELETE permission
   */
  canDelete(): boolean {
    return (this.access & PermissionAccess.DELETE) !== 0;
  }
  
  /**
   * Get the group value
   */
  group(): number {
    return this.bitmask >> this.permask.accessBits;
  }
  
  /**
   * Get the group name
   */
  groupName(): string | undefined {
    return this.permask.getGroupName(this.bitmask);
  }
  
  /**
   * Check if permission belongs to specified group
   */
  inGroup(group: number | string): boolean {
    return this.permask.hasGroup(this.bitmask, group);
  }
  
  /**
   * Get detailed information about this permission
   */
  explain(): {
    group: number;
    groupName?: string;
    permissions: Partial<Record<keyof T, boolean>>;
  } {
    return this.permask.parse(this.bitmask);
  }
}

/**
 * Flexible permission management system with fluent API
 */
export class Permask<T extends Record<string, number> = Record<string, number>> {
  // Common permission presets
  readonly FULL_ACCESS: number;
  readonly NO_ACCESS: number;
  readonly READ_ONLY: number;
  readonly READ_WRITE: number;
  
  // Make accessMask accessible to context classes
  readonly accessMask: number;
  readonly accessBits: number;
  
  private permissions: T;
  private groups: Record<string, number>;
  private permissionSets: Record<string, Array<keyof T>>;
  
  constructor(options: {
    permissions: T;
    accessBits: number;
    accessMask: number;
    groups: Record<string, number>;
    permissionSets: Record<string, Array<keyof T>>;
  }) {
    this.permissions = options.permissions;
    this.accessBits = options.accessBits;
    this.accessMask = options.accessMask;
    this.groups = options.groups;
    this.permissionSets = options.permissionSets;
    
    // Initialize presets
    this.FULL_ACCESS = this.accessMask;
    this.NO_ACCESS = 0;
    this.READ_ONLY = PermissionAccess.READ;
    this.READ_WRITE = PermissionAccess.READ | PermissionAccess.WRITE;
  }
  
  /**
   * Start building a permission for a specific group
   * @example
   * // Create read-write permission for DOCUMENTS group
   * const permission = permask.for('DOCUMENTS').grant(['READ', 'WRITE']).value();
   */
  for(group: number | string): PermissionContext<T> {
    return new PermissionContext<T>(this, group);
  }
  
  /**
   * Check permissions in a bitmask
   * @example
   * // Check if user has READ permission
   * if (permask.check(userPermission).can('READ')) {
   *   // Allow reading
   * }
   */
  check(bitmask: number): PermissionCheck<T> {
    return new PermissionCheck<T>(this, bitmask);
  }
  
  /**
   * Get a permission value by key
   */
  getPermissionValue(permission: keyof T): number {
    return this.permissions[permission as string] || 0;
  }
  
  /**
   * Get a named permission set
   */
  getPermissionSet(name: string): Array<keyof T> | undefined {
    return this.permissionSets[name];
  }
  
  /**
   * Get a group value by name
   */
  getGroupByName(name: string): number | undefined {
    return this.groups[name];
  }
  
  /**
   * Get group name from a bitmask
   */
  getGroupName(bitmask: number): string | undefined {
    const groupValue = bitmask >> this.accessBits;
    const entry = Object.entries(this.groups).find(([, value]) => value === groupValue);
    return entry?.[0];
  }
  
  /**
   * Check if a bitmask belongs to a specific group
   */
  hasGroup(bitmask: number, group: number | string): boolean {
    const groupValue = typeof group === 'string' ? this.groups[group] || 0 : group;
    return (bitmask >> this.accessBits) === groupValue;
  }
  
  /**
   * Parse a bitmask into human-readable form
   */
  parse(bitmask: number): {
    group: number;
    groupName?: string;
    permissions: Partial<Record<keyof T, boolean>>;
  } {
    const group = bitmask >> this.accessBits;
    const access = bitmask & this.accessMask;
    const permissions = {} as Partial<Record<keyof T, boolean>>;
    
    for (const key of Object.keys(this.permissions)) {
      const permValue = this.permissions[key];
      permissions[key as keyof T] = (access & permValue) !== 0;
    }
    
    return {
      group,
      groupName: this.getGroupName(bitmask),
      permissions
    };
  }
  
  /**
   * Convert a string-based permission description to a bitmask
   * @example
   * // Create a permission from a string description
   * const permission = permask.fromString('DOCUMENTS:READ,WRITE');
   */
  fromString(permissionString: string): number {
    const [groupPart, permissionPart] = permissionString.split(':');
    
    if (!groupPart) return 0;
    
    const group = this.groups[groupPart] !== undefined ? this.groups[groupPart] : Number(groupPart) || 0;
    
    if (!permissionPart) {
      return group << this.accessBits;
    }
    
    const permList = permissionPart.split(',')
      .map(p => p.trim())
      .filter(p => p !== '');
      
    if (permList.includes('*') || permList.includes('ALL')) {
      return (group << this.accessBits) | this.accessMask;
    }
    
    let access = 0;
    for (const perm of permList) {
      // Check if it's a permission set
      if (this.permissionSets[perm]) {
        for (const subPerm of this.permissionSets[perm]) {
          access |= this.permissions[subPerm as string] || 0;
        }
      } else {
        // Treat as individual permission
        access |= this.permissions[perm as keyof T] || 0;
      }
    }
    
    return (group << this.accessBits) | access;
  }
  
  /**
   * Convert a bitmask to a string representation
   */
  toString(bitmask: number): string {
    const parsed = this.parse(bitmask);
    const groupName = parsed.groupName || parsed.group.toString();
    
    const permissionNames = Object.entries(parsed.permissions)
      .filter(([, enabled]) => enabled)
      .map(([name]) => name);
    
    if (permissionNames.length === 0) {
      return `${groupName}:NONE`;
    }
    
    // Check if all permissions are enabled
    if ((bitmask & this.accessMask) === this.accessMask) {
      return `${groupName}:ALL`;
    }
    
    return `${groupName}:${permissionNames.join(',')}`;
  }
  
  /**
   * Create a new builder with the current configuration
   */
  toBuilder(): PermaskBuilder<T> {
    return new PermaskBuilder<T>({
      permissions: this.permissions,
      accessBits: this.accessBits,
      accessMask: this.accessMask,
      groups: { ...this.groups }
    });
  }
}
