export type NumberValuesType<T> = {
  [K in keyof T]: T[K] extends number ? T[K] : never;
}[keyof T];

export type StringKeysType<T> = Extract<keyof T, string>;
export type EnumOrObjectType<T> = Record<keyof T, NumberValuesType<T>>;
