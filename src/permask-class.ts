/**
 * Default number of bits allocated for permissions (4 bits)
 */
const ACCESS_BITS = 4

/**
 * Default access mask for 5 bits (0b11111 = 31)
 */
const ACCESS_MASK = (1 << ACCESS_BITS) - 1

/**
 * Default permission values
 */
export const DefaultPermissionAccess = {
  CREATE: 1, // 0b00001
  READ: 2, // 0b00010
  UPDATE: 4, // 0b00100
  DELETE: 8, // 0b01000
  ALL: 15, // 0b01111 - All permissions combined
} as const

/**
 * Permission builder for creating and checking permissions
 */
export class PermaskBuilder<T extends Record<string, number> = Record<string, number>, G extends Record<string, number> = Record<string, number>> {
  private permissions: T & { ALL: number }
  private accessBits: number
  private accessMask: number
  private groups: G = {} as G
  private permissionSets: Record<string, Array<keyof T>> = {}

  constructor(options: {
    permissions?: T | Record<string, number | null | undefined>
    accessBits?: number
    accessMask?: number
    groups?: G | Record<string, number | null | undefined>
  } = {}) {
    this.accessBits = options.accessBits || ACCESS_BITS

    if (options.accessMask !== undefined) {
      this.accessMask = options.accessMask
    }
    else if (options.accessBits !== undefined) {
      this.accessMask = (1 << this.accessBits) - 1
    }
    else {
      this.accessMask = ACCESS_MASK
    }

    // Initialize with default or provided permissions
    const basePermissions = options.permissions || DefaultPermissionAccess as unknown as T

    // First check to see if any permission values exceed the current access bit limit
    let maxPermValue = 0
    for (const [_key, value] of Object.entries(basePermissions)) {
      if (typeof value === 'number' && value > maxPermValue) {
        maxPermValue = value
      }
    }

    // Calculate minimum required bits for the maximum permission value
    if (maxPermValue > this.accessMask) {
      const minimumBits = Math.ceil(Math.log2(maxPermValue + 1))
      throw new Error(`Permission value ${maxPermValue} exceeds maximum value ${this.accessMask} for ${this.accessBits} bits. Please use at least ${minimumBits} access bits.`)
    }

    // Automatically assign permission values for those without explicit values
    const processedPermissions: Record<string, number> = {}
    let nextValue = 1 // Start with 1 (0b1)

    // First pass: process explicitly defined numeric values
    for (const [key, value] of Object.entries(basePermissions)) {
      if (key !== 'ALL') {
        if (typeof value === 'number') {
          processedPermissions[key] = value
          // Make sure we don't use this bit for auto-assigned permissions
          while ((nextValue & value) !== 0 && nextValue <= this.accessMask) {
            nextValue = nextValue << 1
          }
        }
      }
    }

    // Second pass: auto-assign values for permissions without explicit values
    for (const [key, value] of Object.entries(basePermissions)) {
      if (key !== 'ALL') {
        if (value === null || value === undefined || typeof value !== 'number') {
          // Auto-assign a permission value
          if (nextValue <= this.accessMask) {
            processedPermissions[key] = nextValue
            nextValue = nextValue << 1
          }
          else {
            throw new Error(`Not enough bits available to auto-assign permission '${key}'. Increase accessBits.`)
          }
        }
      }
    }

    // Calculate the combined value of all permissions
    let allPermissionsValue = 0
    for (const value of Object.values(processedPermissions)) {
      allPermissionsValue |= value
    }

    // Handle the ALL permission
    if ('ALL' in basePermissions && typeof basePermissions.ALL === 'number') {
      processedPermissions.ALL = basePermissions.ALL
    }
    else {
      // If ALL isn't defined, use the calculated mask or accessMask
      processedPermissions.ALL = allPermissionsValue || this.accessMask
    }

    this.permissions = processedPermissions as T & { ALL: number }

    // Process and assign groups
    if (options.groups) {
      this.groups = options.groups as G
    }

    // Validate permissions fit within specified bits
    for (const [key, value] of Object.entries(this.permissions)) {
      if (value > this.accessMask) {
        throw new Error(`Permission '${key}' value ${value} exceeds maximum value ${this.accessMask} for ${this.accessBits} bits`)
      }
    }
  }

  /**
   * Define a new permission
   */
  definePermission(name: string, value: number): PermaskBuilder<T & Record<string, number>, G> {
    // Calculate minimum required bits for this permission value
    if (value > this.accessMask) {
      const minimumBits = Math.ceil(Math.log2(value + 1))
      throw new Error(`Permission value ${value} exceeds maximum value ${this.accessMask} for ${this.accessBits} bits. Please use at least ${minimumBits} access bits.`)
    }

    (this.permissions as Record<string, number>)[name] = value
    return this as unknown as PermaskBuilder<T & Record<string, number>, G>
  }

  /**
   * Define a new group
   */
  defineGroup<K extends string>(name: K, value: number): PermaskBuilder<T, G & Record<K, number>> {
    (this.groups as Record<string, number>)[name] = value
    return this as unknown as PermaskBuilder<T, G & Record<K, number>>
  }

  /**
   * Define a named set of permissions for reuse
   */
  definePermissionSet(name: string, permissions: Array<keyof T>): this {
    this.permissionSets[name] = permissions
    return this
  }

  /**
   * Build and return a Permask instance
   */
  build(): Permask<T, G> {
    return new Permask<T, G>({
      permissions: this.permissions as unknown as T,
      accessBits: this.accessBits,
      accessMask: this.accessMask,
      groups: this.groups,
      permissionSets: this.permissionSets as Record<string, Array<keyof T>>,
    })
  }
}

/**
 * Permission granting context for creating new permissions
 */
export class PermissionContext<T extends Record<string, number>, G extends Record<string, number> = Record<string, number>> {
  private bitmask: number = 0

  constructor(
    private permask: Permask<T, G>,
    group: keyof G | number,
  ) {
    const groupValue = typeof group === 'string'
      ? permask.getGroupByName(group) || 0
      : Number(group)

    this.bitmask = groupValue << permask.accessBits
  }

  /**
   * Grant specific permissions
   */
  grant(permissions: Array<keyof T>): this {
    for (const permission of permissions) {
      const permValue = this.permask.getPermissionValue(permission)

      // Special handling for ALL permission - grant all bits
      if (permission === 'ALL' as keyof T) {
        this.grantAll()
        continue
      }

      if (permValue) {
        const currentAccess = this.bitmask & this.permask.accessMask
        const newAccess = currentAccess | permValue
        this.bitmask = (this.bitmask & ~this.permask.accessMask) | newAccess
      }
    }

    return this
  }

  /**
   * Grant a predefined permission set
   */
  grantSet(setName: string): this {
    const permissions = this.permask.getPermissionSet(setName)
    if (permissions) {
      return this.grant(permissions)
    }
    return this
  }

  /**
   * Grant full/all permissions
   */
  grantAll(): this {
    this.bitmask = (this.bitmask & ~this.permask.accessMask) | this.permask.accessMask
    return this
  }

  /**
   * Get the resulting permission bitmask
   */
  value(): number {
    return this.bitmask
  }
}

/**
 * Permission checking context
 */
export class PermissionCheck<T extends Record<string, number>, G extends Record<string, number> = Record<string, number>> {
  private access: number

  constructor(
    private permask: Permask<T, G>,
    private bitmask: number,
  ) {
    this.access = bitmask & permask.accessMask
  }

  /**
   * Check if has specific permission
   */
  can<K extends keyof T | 'ALL'>(permission: K): boolean {
    // Special handling for the ALL permission
    if (permission === 'ALL') {
      // For ALL permission, we need to check if all bits are set
      return this.canEverything()
    }

    const permValue = this.permask.getPermissionValue(permission as keyof T)
    return permValue ? (this.access & permValue) !== 0 : false
  }

  /**
   * Check if has all specified permissions
   */
  canAll(permissions: Array<keyof T>): boolean {
    for (const permission of permissions) {
      if (!this.can(permission)) {
        return false
      }
    }
    return true
  }

  /**
   * Check if has any of the specified permissions
   */
  canAny(permissions: Array<keyof T>): boolean {
    for (const permission of permissions) {
      if (this.can(permission)) {
        return true
      }
    }
    return false
  }

  /**
   * Check if has all possible permissions
   */
  canEverything(): boolean {
    return this.access === this.permask.accessMask
  }

  /**
   * Check if has the ALL permission specifically
   */
  hasAllPermission(): boolean {
    const allPermValue = this.permask.getPermissionValue('ALL')
    return allPermValue ? (this.access & allPermValue) !== 0 : this.canEverything()
  }

  /**
   * Check if has standard CREATE permission
   */
  canCreate(): boolean {
    return (this.access & DefaultPermissionAccess.CREATE) !== 0
  }

  /**
   * Check if has standard READ permission
   */
  canRead(): boolean {
    return (this.access & DefaultPermissionAccess.READ) !== 0
  }

  /**
   * Check if has standard UPDATE permission
   */
  canUpdate(): boolean {
    return (this.access & DefaultPermissionAccess.UPDATE) !== 0
  }

  /**
   * Check if has standard DELETE permission
   */
  canDelete(): boolean {
    return (this.access & DefaultPermissionAccess.DELETE) !== 0
  }

  /**
   * Get the group value
   */
  group(): number {
    return this.bitmask >> this.permask.accessBits
  }

  /**
   * Get the group name
   */
  groupName(): keyof G | undefined {
    return this.permask.getGroupName(this.bitmask) as keyof G | undefined
  }

  /**
   * Check if permission belongs to specified group
   */
  inGroup(group: keyof G | number): boolean {
    return this.permask.hasGroup(this.bitmask, group)
  }

  /**
   * Get detailed information about this permission
   */
  explain(): {
    group: number
    groupName?: keyof G
    permissions: Partial<Record<keyof T, boolean>>
  } {
    return this.permask.parse(this.bitmask)
  }
}

/**
 * Flexible permission management system with fluent API
 */
export class Permask<T extends Record<string, number> = Record<string, number>, G extends Record<string, number> = Record<string, number>> {
  // Common permission presets
  readonly FULL_ACCESS: number
  readonly NO_ACCESS: number

  // Make accessMask accessible to context classes
  readonly accessMask: number
  readonly accessBits: number

  private permissions: T
  readonly groups: G
  private permissionSets: Record<string, Array<keyof T>>

  constructor(options: {
    permissions: T
    accessBits: number
    accessMask: number
    groups: G
    permissionSets: Record<string, Array<keyof T>>
  }) {
    this.permissions = options.permissions
    this.accessBits = options.accessBits
    this.accessMask = options.accessMask
    this.groups = options.groups
    this.permissionSets = options.permissionSets

    // Initialize presets
    this.FULL_ACCESS = this.accessMask
    this.NO_ACCESS = 0
  }

  /**
   * Start building a permission for a specific group
   * @example
   * // Create read-create permission for DOCUMENTS group
   * const permission = permask.forGroup('DOCUMENTS').grant(['READ', 'CREATE']).value();
   */
  forGroup<K extends keyof G | number>(group: K): PermissionContext<T, G> {
    return new PermissionContext<T, G>(this, group)
  }

  /**
   * Check permissions in a bitmask
   * @example
   * // Check if user has READ permission
   * if (permask.check(userPermission).can('READ')) {
   *   // Allow reading
   * }
   */
  check(bitmask: number): PermissionCheck<T, G> {
    return new PermissionCheck<T, G>(this, bitmask)
  }

  /**
   * Get a permission value by key
   */
  getPermissionValue<K extends keyof T | 'ALL'>(permission: K): number {
    return (this.permissions as any)[permission] || 0
  }

  /**
   * Get a named permission set
   */
  getPermissionSet(name: string): Array<keyof T> | undefined {
    return this.permissionSets[name]
  }

  /**
   * Get a group value by name
   */
  getGroupByName(name: keyof G): number | undefined {
    return this.groups[name]
  }

  /**
   * Get group name from a bitmask
   */
  getGroupName(bitmask: number): keyof G | undefined {
    const groupValue = bitmask >> this.accessBits
    const entry = Object.entries(this.groups).find(([, value]) => value === groupValue)
    return entry?.[0] as keyof G | undefined
  }

  /**
   * Check if a bitmask belongs to a specific group
   */
  hasGroup(bitmask: number, group: keyof G | number): boolean {
    const groupValue = typeof group === 'string'
      ? this.groups[group] || 0
      : Number(group)
    return (bitmask >> this.accessBits) === groupValue
  }

  /**
   * Parse a bitmask into human-readable form
   */
  parse(bitmask: number): {
    group: number
    groupName?: keyof G
    permissions: Partial<Record<keyof T, boolean>>
  } {
    const group = bitmask >> this.accessBits
    const access = bitmask & this.accessMask
    const permissions = {} as Partial<Record<keyof T, boolean>>

    for (const key of Object.keys(this.permissions)) {
      if (key === 'ALL') {
        // ALL permission should be true only if all bits in the accessMask are set
        permissions[key as keyof T] = (access === this.accessMask)
      }
      else {
        const permValue = this.permissions[key]
        permissions[key as keyof T] = (access & permValue) !== 0
      }
    }

    return {
      group,
      groupName: this.getGroupName(bitmask),
      permissions,
    }
  }

  /**
   * Convert a string-based permission description to a bitmask
   * @example
   * // Create a permission from a string description
   * const permission = permask.fromString('DOCUMENTS:READ,CREATE');
   */
  fromString(permissionString: string): number {
    const [groupPart, permissionPart] = permissionString.split(':')

    if (!groupPart)
      return 0

    const group = this.groups[groupPart as keyof G] !== undefined
      ? Number(this.groups[groupPart as keyof G])
      : Number(groupPart) || 0

    if (!permissionPart) {
      return group << this.accessBits
    }

    const permList = permissionPart.split(',')
      .map(p => p.trim())
      .filter(p => p !== '')

    if (permList.includes('*') || permList.includes('ALL')) {
      return (group << this.accessBits) | this.accessMask
    }

    let access = 0
    for (const perm of permList) {
      // Check if it's a permission set
      if (this.permissionSets[perm]) {
        for (const subPerm of this.permissionSets[perm]) {
          access |= this.permissions[subPerm as string] || 0
        }
      }
      else {
        // Treat as individual permission
        access |= this.permissions[perm as keyof T] || 0
      }
    }

    return (group << this.accessBits) | access
  }

  /**
   * Convert a bitmask to a string representation
   */
  toString(bitmask: number): string {
    const parsed = this.parse(bitmask)
    const groupName = parsed.groupName ? String(parsed.groupName) : parsed.group.toString()

    // If all permission bits are set, return ALL
    if ((bitmask & this.accessMask) === this.accessMask) {
      return `${groupName}:ALL`
    }

    // Get the access bits only
    const accessBits = bitmask & this.accessMask
    
    // If no access bits are set, return NONE
    if (accessBits === 0) {
      return `${groupName}:NONE`
    }

    // Only include basic permissions (single bit values, not combinations)
    const basicPermissions = Object.entries(this.permissions)
      .filter(([name, value]) => {
        // Filter out combination permissions (those with underscore) and ALL/NONE
        return name !== 'ALL' && 
               name !== 'NONE' && 
               !name.includes('_') && 
               (accessBits & value) === value
      })
      .map(([name]) => name)

    // If no basic permissions were found (shouldn't happen if accessBits > 0)
    if (basicPermissions.length === 0) {
      return `${groupName}:CUSTOM`
    }

    return `${groupName}:${basicPermissions.join(',')}`
  }

  /**
   * Create a new builder with the current configuration
   */
  toBuilder(): PermaskBuilder<T, G> {
    return new PermaskBuilder<T, G>({
      permissions: this.permissions,
      accessBits: this.accessBits,
      accessMask: this.accessMask,
      groups: { ...this.groups },
    })
  }

  /**
   * Get all defined group names
   */
  getGroupNames(): Array<keyof G> {
    return Object.keys(this.groups) as Array<keyof G>
  }
}
