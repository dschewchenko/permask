export const base64ToUrlSafe = (base64: string) => base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

export const urlSafeToBase64 = (base64: string) => base64.replace(/-/g, "+").replace(/_/g, "/");

type BitDepth = 8 | 16 | 32;

const prefixMap: Record<BitDepth, string> = { 8: "A", 16: "B", 32: "C" };
const reversePrefixMap: Record<string, BitDepth> = { "A": 8, "B": 16, "C": 32 };

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
 * console.log(packed); // "AAQIDBAU="
 */
export function packBitmasks(bitmasks: number[], urlSafe = false): string {
  if (!bitmasks?.length) return "";

  const max = Math.max(...bitmasks);
  const depth: BitDepth = max < 256 ? 8 : max < 65536 ? 16 : 32;
  const bytesPerElement = depth >> 3;
  const buffer = new ArrayBuffer(bitmasks.length * bytesPerElement);
  const TypedArray = depth === 8 ? Uint8Array : depth === 16 ? Uint16Array : Uint32Array;
  const view = new TypedArray(buffer).fill(0);

  for (let i = 0; i < bitmasks.length; i++) {
    view[i] = bitmasks[i];
  }

  const uint8View = new Uint8Array(buffer);
  let binaryString = "";
  for (let i = 0; i < uint8View.length; i++) {
    binaryString += String.fromCharCode(uint8View[i]);
  }

  const base64 = prefixMap[depth] + btoa(binaryString);
  return urlSafe ? base64ToUrlSafe(base64) : base64;
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
 * const packed = "AAQIDBAU=";
 * const bitmasks = unpackBitmasks(packed);
 * console.log(bitmasks); // [1, 2, 3, 4, 5]
 */
export function unpackBitmasks(packed: string, urlSafe = false): number[] {
  if (!packed) return [];

  try {
    const prefix = packed[0];
    const base64String = urlSafe ? urlSafeToBase64(packed.substring(1)) : packed.substring(1);
    const depth = reversePrefixMap[prefix];

    if (!depth) throw new Error("Invalid packed string: unknown prefix.");

    const binaryString = atob(base64String);
    const buffer = new ArrayBuffer(binaryString.length);
    const uint8View = new Uint8Array(buffer).fill(0);

    for (let i = 0; i < binaryString.length; i++) {
      uint8View[i] = binaryString.charCodeAt(i);
    }

    const TypedArray = depth === 8 ? Uint8Array : depth === 16 ? Uint16Array : Uint32Array;
    const finalView = new TypedArray(buffer);

    return Array.from(finalView);
  } catch (e) {
    console.error("Failed to unpack string:", e);
    return [];
  }
}
