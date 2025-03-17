export const base64ToUrlSafe = (base64: string) => base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

export const urlSafeToBase64 = (base64: string) => base64.replace(/-/g, "+").replace(/_/g, "/");

/**
 * Convert bitmasks to base64
 * Also it will be more compact than using JSON.stringify
 *
 * @param bitmasks
 * @param urlSafe - if true, will use url safe base64
 *
 * @returns {string} - base64 string
 *
 * @example
 *
 * const bitmasks = [1, 2, 3, 4, 5];
 * const packed = packBitmasks(bitmasks);
 * console.log(packed); // "AQIDBAU="
 */
export function packBitmasks(bitmasks: number[], urlSafe = false): string {
  if (!bitmasks?.length) {
    return "";
  }

  const buffer = new ArrayBuffer(bitmasks.length * 4);
  const uint32View = new Uint32Array(buffer);

  for (let i = 0; i < bitmasks.length; i++) {
    uint32View[i] = bitmasks[i];
  }

  const uint8View = new Uint8Array(buffer);
  const binary = String.fromCharCode.apply(null, uint8View as unknown as number[]);

  const base64String = btoa(binary);
  return urlSafe ? base64ToUrlSafe(base64String) : base64String;
}

/**
 * Convert base64 to bitmasks
 *
 * @param packed
 * @param urlSafe - if true, will use url safe base64
 *
 * @returns {number[]} - array of bitmasks
 *
 * @example
 *
 * const packed = "AQIDBAU=";
 * const bitmasks = unpackBitmasks(packed);
 * console.log(bitmasks); // [1, 2, 3, 4, 5]
 */
export function unpackBitmasks(packed: string, urlSafe = false): number[] {
  try {
    const base64String = urlSafe ? urlSafeToBase64(packed) : packed;
    const binary = atob(base64String);

    const count = binary.length >>> 2;
    const result = new Array(count);

    for (let i = 0, offset = 0; i < count; i++, offset += 4) {
      result[i] =
        (
          binary.charCodeAt(offset) |
          (binary.charCodeAt(offset + 1) << 8) |
          (binary.charCodeAt(offset + 2) << 16) |
          (binary.charCodeAt(offset + 3) << 24)
        ) >>> 0;
    }

    return result;
  } catch (e) {
    console.error("Error unpacking bitmasks:", e);
    return [];
  }
}
