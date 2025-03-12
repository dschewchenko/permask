import { describe, it, expect, vi } from 'vitest';
import { DefaultPermissionAccess, Permask, PermaskBuilder } from '../permask-class';

describe('Group Versioning and Migration', () => {
  it('should support defining groups with metadata', () => {
    const permask = new PermaskBuilder({
      permissions: DefaultPermissionAccess,
      groups: {
        USERS: { id: 1, since: '1.0.0' },
        DOCUMENTS: { id: 2, since: '1.0.0', deprecated: true, deprecatedSince: '2.0.0', replacedBy: 'FILES' },
        FILES: { id: 3, since: '2.0.0' }
      }
    }).build();
    
    expect(permask.isGroupDeprecated('DOCUMENTS')).toBe(true);
    expect(permask.isGroupDeprecated('FILES')).toBe(false);
    
    const docInfo = permask.getGroupDeprecationInfo('DOCUMENTS');
    expect(docInfo?.deprecated).toBe(true);
    expect(docInfo?.replacedBy).toBe('FILES');
    expect(docInfo?.deprecatedSince).toBe('2.0.0');
  });
  
  it('should support defining and deprecating groups with builder methods', () => {
    const permask = new PermaskBuilder({
      permissions: DefaultPermissionAccess
    })
    .defineGroup('USERS', 1, { since: '1.0.0' })
    .defineGroup('DOCUMENTS', 2, { since: '1.0.0' })
    .defineGroup('FILES', 3, { since: '2.0.0' })
    .deprecateGroup('DOCUMENTS', { 
      replacedBy: 'FILES',
      version: '2.0.0',
      message: 'DOCUMENTS group is deprecated, use FILES instead'
    })
    .build();
    
    expect(permask.isGroupDeprecated('DOCUMENTS')).toBe(true);
    expect(permask.isGroupDeprecated('FILES')).toBe(false);
    
    const docInfo = permask.getGroupDeprecationInfo('DOCUMENTS');
    expect(docInfo?.deprecated).toBe(true);
    expect(docInfo?.replacedBy).toBe('FILES');
    expect(docInfo?.message).toBe('DOCUMENTS group is deprecated, use FILES instead');
  });
  
  it('should detect deprecated groups in permission checks', () => {
    const permask = new PermaskBuilder({
      permissions: DefaultPermissionAccess
    })
    .defineGroup('DOCUMENTS', 1, { deprecated: true, replacedBy: 'FILES' })
    .defineGroup('FILES', 2)
    .build();
    
    const oldPerm = permask.for('DOCUMENTS').grant(['READ', 'UPDATE']).value();
    const check = permask.check(oldPerm);
    
    expect(check.isInDeprecatedGroup()).toBe(true);
    expect(check.getGroupDeprecationInfo()?.deprecated).toBe(true);
    expect(check.getGroupDeprecationInfo()?.replacedBy).toBe('FILES');
  });
  
  it('should warn when using deprecated groups', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const permask = new PermaskBuilder({
      permissions: DefaultPermissionAccess
    })
    .defineGroup('DOCUMENTS', 1, { since: '1.0.0' })
    .defineGroup('FILES', 2, { since: '2.0.0' })
    .deprecateGroup('DOCUMENTS', { 
      replacedBy: 'FILES', 
      version: '2.0.0',
      message: 'DOCUMENTS group is deprecated, use FILES instead'
    })
    .build();
    
    const oldPerm = permask.for('DOCUMENTS').grant(['READ']).value();
    
    // Should not warn by default
    permask.check(oldPerm);
    expect(consoleSpy).not.toHaveBeenCalled();
    
    // Should warn with warnOnDeprecated option
    permask.check(oldPerm, { warnOnDeprecated: true });
    expect(consoleSpy).toHaveBeenCalledWith('DOCUMENTS group is deprecated, use FILES instead');
    
    consoleSpy.mockRestore();
  });
  
  it('should automatically migrate deprecated group permissions', () => {
    const permask = new PermaskBuilder({
      permissions: DefaultPermissionAccess
    })
    .defineGroup('DOCUMENTS', 1, { since: '1.0.0' })
    .defineGroup('FILES', 2, { since: '2.0.0' })
    .deprecateGroup('DOCUMENTS', { replacedBy: 'FILES' })
    .defineGroupMigration('DOCUMENTS', 'FILES', {
      'READ': 'READ',
      'UPDATE': 'UPDATE',
      'DELETE': 'DELETE'
    })
    .build();
    
    const oldPerm = permask.for('DOCUMENTS').grant(['READ', 'UPDATE']).value();
    
    // Without auto-migration
    const check = permask.check(oldPerm);
    expect(check.inGroup('DOCUMENTS')).toBe(true);
    expect(check.inGroup('FILES')).toBe(false);
    
    // With auto-migration
    const autoCheck = permask.check(oldPerm, { autoMigrate: true });
    expect(autoCheck.inGroup('DOCUMENTS')).toBe(false);
    expect(autoCheck.inGroup('FILES')).toBe(true);
    expect(autoCheck.can('READ')).toBe(true);
    expect(autoCheck.can('UPDATE')).toBe(true);
    
    // Test direct migration method
    const result = permask.migrateIfDeprecated(oldPerm);
    expect(result.wasMigrated).toBe(true);
    expect(result.check.inGroup('FILES')).toBe(true);
  });
  
  it('should handle complex permission mapping during migration', () => {
    const permask = new PermaskBuilder<{
      VIEW: number;
      EDIT: number;
      DELETE: number;
      READ: number;
      UPDATE: number;
      REMOVE: number;
    }>({
      permissions: {
        VIEW: 1,
        EDIT: 2,
        DELETE: 4,
        READ: 8,
        UPDATE: 16,
        REMOVE: 32
      }
      // accessBits artık otomatik hesaplanacak, bu nedenle kaldırıldı
    })
    .defineGroup('OLD_DOCS', 1)
    .defineGroup('NEW_DOCS', 2)
    .deprecateGroup('OLD_DOCS', { replacedBy: 'NEW_DOCS' })
    .defineGroupMigration('OLD_DOCS', 'NEW_DOCS', {
      // Map old permissions to new ones
      'VIEW': 'READ',
      'EDIT': 'UPDATE',
      'DELETE': 'REMOVE'
    })
    .build();
    
    const oldPerm = permask.for('OLD_DOCS').grant(['VIEW', 'EDIT']).value();
    
    // Test migration with permission mapping
    const result = permask.migrateIfDeprecated(oldPerm);
    expect(result.wasMigrated).toBe(true);
    
    // Original permissions should map to their new equivalents
    expect(result.check.can('VIEW')).toBe(false); // No longer has old permission
    expect(result.check.can('READ')).toBe(true);  // Has new mapped permission
    expect(result.check.can('EDIT')).toBe(false); // No longer has old permission
    expect(result.check.can('UPDATE')).toBe(true); // Has new mapped permission
  });
});
