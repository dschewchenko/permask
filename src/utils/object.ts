export type PathPropertyValue = object | string | number | boolean | bigint | symbol | null | undefined;

type PathLookup = { found: true; value: unknown } | { found: false };

interface PermissionPathNode {
  readonly [segment: string]: PermissionPathNode | Array<number> | null | undefined;
}

export function findPathValue(value: unknown, path: string): PathLookup {
  if (!path) {
    return { found: true, value };
  }
  if (!value) {
    return { found: false };
  }

  const [head, ...tail] = path.split(".");
  const target = value as PermissionPathNode;
  // Preserve property access on inherited getters and boxed primitives.
  if (target[head] === undefined) {
    return { found: false };
  }

  return findPathValue(target[head], tail.join("."));
}

export function readPermissionBitmasks(source: unknown, path: string): Array<number> {
  const property = findPathValue(source, path);
  // The authentication middleware supplies number[] at the configured path.
  return property.found ? (property.value as Array<number>) : [];
}
