import { PermissionAccess } from "../constants/permission";
import { getPermissionAccess, getPermissionGroup } from "./bitmask";

export type FormatBitmaskOptions = {
  separator?: string;
  joinWith?: string;
  none?: string;
  includeGroupId?: boolean;
};

const accessOrder = [
  ["read", PermissionAccess.READ],
  ["create", PermissionAccess.CREATE],
  ["update", PermissionAccess.UPDATE],
  ["delete", PermissionAccess.DELETE]
] as const;

/**
 * Format a permission bitmask into a readable string.
 *
 * @example
 * formatBitmask(25, { POSTS: 1 }) // "POSTS:read|delete"
 */
export function formatBitmask(
  bitmask: number,
  groups?: Record<string, number | string>,
  options: FormatBitmaskOptions = {}
) {
  const groupId = getPermissionGroup(bitmask);
  const separator = options.separator ?? ":";
  const joinWith = options.joinWith ?? "|";
  const none = options.none ?? "none";

  let groupLabel = String(groupId);

  if (groups) {
    const entries = Object.entries(groups).filter(([, value]) => typeof value === "number") as [string, number][];
    const reverseMap = new Map(entries.map(([key, value]) => [value, key]));
    const groupName = reverseMap.get(groupId);

    if (groupName) {
      groupLabel = options.includeGroupId ? `${groupName}(${groupId})` : groupName;
    }
  }

  const access = getPermissionAccess(bitmask);
  const accessLabels = accessOrder.filter(([, flag]) => (access & flag) === flag).map(([name]) => name);
  const accessLabel = accessLabels.length ? accessLabels.join(joinWith) : none;

  return `${groupLabel}${separator}${accessLabel}`;
}
