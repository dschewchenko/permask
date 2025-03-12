import { describe, it, expect, vi } from 'vitest';
import { PermaskBuilder } from '../permask-class';

describe('Automatic AccessBits Calculation', () => {
  it('should automatically calculate required bits based on permissions', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Max value is 32, requires 6 bits
    const permask = new PermaskBuilder({
      permissions: {
        PERM1: 1,
        PERM2: 2, 
        PERM3: 4,
        PERM4: 8,
        PERM5: 16,
        PERM6: 32
      }
      // No accessBits specified
    }).build();
    
    // Should automatically use 6 bits (max value of 63)
    expect(permask.accessMask).toBe(63);
    expect(permask.accessBits).toBe(6);
    
    consoleSpy.mockRestore();
  });
  
  it('should warn and adjust if provided bits are insufficient', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Needs 6 bits but only 4 specified
    const permask = new PermaskBuilder({
      permissions: {
        PERM1: 1,
        PERM2: 2,
        PERM3: 32 // Requires 6 bits
      },
      accessBits: 4 // Too small
    }).build();
    
    // Should adjust to 6 bits
    expect(permask.accessBits).toBe(6);
    expect(permask.accessMask).toBe(63);
    
    // Should have warned about the adjustment
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Provided accessBits (4) is too small')
    );
    
    consoleSpy.mockRestore();
  });
  
  it('should respect provided accessBits when sufficient', () => {
    // Max value is 8, requires 4 bits, but we provide 5
    const permask = new PermaskBuilder({
      permissions: {
        PERM1: 1,
        PERM2: 2,
        PERM3: 8
      },
      accessBits: 5 // More than necessary (4 would be enough)
    }).build();
    
    // Should use the provided value
    expect(permask.accessBits).toBe(5);
    expect(permask.accessMask).toBe(31);
  });
  
  it('should handle empty permission objects', () => {
    const permask = new PermaskBuilder({
      permissions: {}
    }).build();
    
    // Should use default (5 bits)
    expect(permask.accessBits).toBe(5);
    expect(permask.accessMask).toBe(31);
  });
});
