import { PermissionAccess, type PermissionAccessBits, type PermissionAccessType } from "./constants/permission";
import { PermaskError } from "./errors";
import type { EnumOrObjectType, StringKeysType } from "./types/utils";
import {
  canCreate,
  canDelete,
  canRead,
  canUpdate,
  createBitmask,
  getPermissionGroup,
  hasPermissionAccess,
  hasPermissionGroup,
  parseBitmask
} from "./utils/bitmask";

type CreateConfig<T> = Omit<Parameters<typeof createBitmask>[0], "group"> & { group: T | number };

type PermaskInstance<GroupNames extends string> = {
  create: (config: CreateConfig<GroupNames>) => number;
  parse: (bitmask: number) => ReturnType<typeof parseBitmask> & { groupName: GroupNames | undefined };
  hasGroup: <Bitmask extends number>(bitmask: Bitmask, group: GroupNames | number) => boolean;
  getGroupName: <Bitmask extends number>(bitmask: Bitmask) => GroupNames | undefined;
  hasAccess: <Bitmask extends number>(
    bitmask: Bitmask,
    group: GroupNames | number,
    access: Lowercase<PermissionAccessType> | PermissionAccessBits
  ) => boolean;
  canRead: typeof canRead;
  canCreate: typeof canCreate;
  canDelete: typeof canDelete;
  canUpdate: typeof canUpdate;
};

/**
 * Construct bitmask functions with defined permission groups.
 */
export function createPermask<
  Groups extends Record<string, number | string>,
  EnumOrObj extends EnumOrObjectType<Groups>,
  GroupNames extends StringKeysType<EnumOrObj> = StringKeysType<EnumOrObj>
>(groups: Groups): PermaskInstance<GroupNames> {
  const groupEntries = Object.entries(groups).filter(([, value]) => typeof value === "number") as [
    GroupNames,
    number
  ][];

  // fast and useful maps
  const groupMap = new Map(groupEntries);
  const reverseGroupMap = new Map(groupEntries.map(([key, value]) => [value, key]));

  /**
   * Get the group name from bitmask.
   */
  function getGroupName<Bitmask extends number>(bitmask: Bitmask) {
    const groupValue = getPermissionGroup(bitmask);
    return reverseGroupMap.get(groupValue);
  }

  /**
   * Has group name by string or id
   */
  function hasGroup<Bitmask extends number>(bitmask: Bitmask, group: GroupNames | number): boolean {
    const groupId = typeof group === "string" ? groupMap.get(group) : group;
    return groupId === undefined ? false : hasPermissionGroup(bitmask, groupId);
  }

  /**
   * Has access to group
   */
  function hasAccess<Bitmask extends number>(
    bitmask: Bitmask,
    group: GroupNames | number,
    access: Lowercase<PermissionAccessType> | PermissionAccessBits
  ): boolean {
    if (!hasGroup(bitmask, group)) {
      return false;
    }

    const accessValue =
      typeof access === "string" ? PermissionAccess[access.toUpperCase() as PermissionAccessType] : access;

    return hasPermissionAccess(bitmask, accessValue);
  }

  /**
   * Create a permission bitmask from group name and access flags.
   * This is the new, DX-improved version.
   */
  function create(config: CreateConfig<GroupNames>) {
    let groupId = groupMap.get(config.group as GroupNames);

    if (groupId === undefined) {
      const numericGroupId = config.group as unknown as number;

      if (!reverseGroupMap.has(numericGroupId)) {
        throw new PermaskError("UNKNOWN_GROUP", `Unknown permission group: ${String(config.group)}`);
      }

      groupId = numericGroupId;
    }

    return createBitmask({ ...config, group: groupId });
  }

  /**
   * Parse a bitmask into a configuration object, including the group name.
   * This is the new, DX-improved version.
   */
  function parse(bitmask: number) {
    const parsed = parseBitmask(bitmask);
    const groupName = getGroupName(bitmask);
    return {
      ...parsed,
      groupName
    };
  }

  return {
    create,
    parse,
    hasGroup,
    getGroupName,
    hasAccess,
    canRead,
    canCreate,
    canDelete,
    canUpdate
  };
}
