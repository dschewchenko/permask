export const get = (obj: Record<string, unknown> | null, path: string, defaultValue?: unknown): unknown => {
  if (!path) return obj;
  if (!obj) return defaultValue;
  const [head, ...tail] = path.split(".");

  if (obj[head] === undefined) return defaultValue;

  return get(obj[head] as Record<string, unknown>, tail.join("."), defaultValue) as (typeof obj)[typeof head];
};
