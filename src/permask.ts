import type { EnumOrObjectType, StringKeysType } from "./types/utils";
import {
  canDelete,
  canRead,
  canWrite,
  createBitmask,
  getPermissionGroup,
  hasPermissionGroup,
  parseBitmask
} from "./utils/bitmask";

/**
 * Construct bitmask functions with defined permission groups.
 */
export function createPermask<
  Groups extends Record<string, number | string>,
  EnumOrObj extends EnumOrObjectType<Groups>
>(groups: Groups) {
  const groupEntries = Object.entries(groups).filter(([, value]) => typeof value === "number") as [
    keyof EnumOrObj,
    EnumOrObj[keyof EnumOrObj]
  ][];

  /**
   * Get group name from bitmask.
   */
  function getGroupName<Bitmask extends number>(bitmask: Bitmask) {
    const groupValue = getPermissionGroup(bitmask);
    const entry = groupEntries.find(([, value]) => value === groupValue);
    return entry?.[0] as StringKeysType<EnumOrObj> | undefined;
  }

  return {
    parse: parseBitmask,
    create: createBitmask,
    hasGroup: hasPermissionGroup,
    getGroupName,
    canRead,
    canWrite,
    canDelete
  };
}