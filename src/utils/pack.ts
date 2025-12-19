import { PermaskError } from "../errors";
import { base64ToUrlSafe, decodeBase64, encodeBase64, urlSafeToBase64 } from "./base64";

type BitDepth = 8 | 16 | 32;

const prefixMap: Record<BitDepth, string> = { 8: "A", 16: "B", 32: "C" };
const reversePrefixMap: Record<string, BitDepth> = { A: 8, B: 16, C: 32 };

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

  try {
    const max = bitmasks.reduce((currentMax, bitmask) => Math.max(currentMax, bitmask >>> 0), 0);
    const depth: BitDepth = max < 0x100 ? 8 : max < 0x10000 ? 16 : 32;
    const bytesPerElement = depth >> 3;
    const bytes = new Uint8Array(bitmasks.length * bytesPerElement);

    for (let i = 0; i < bitmasks.length; i++) {
      const value = bitmasks[i] >>> 0;
      const offset = i * bytesPerElement;

      if (depth === 8) {
        bytes[offset] = value & 0xff;
        continue;
      }

      if (depth === 16) {
        bytes[offset] = value & 0xff;
        bytes[offset + 1] = (value >>> 8) & 0xff;
        continue;
      }

      bytes[offset] = value & 0xff;
      bytes[offset + 1] = (value >>> 8) & 0xff;
      bytes[offset + 2] = (value >>> 16) & 0xff;
      bytes[offset + 3] = (value >>> 24) & 0xff;
    }

    const base64 = prefixMap[depth] + encodeBase64(bytes);
    return urlSafe ? base64ToUrlSafe(base64) : base64;
  } catch (cause) {
    throw cause instanceof PermaskError
      ? cause
      : new PermaskError("BASE64_UNAVAILABLE", "Failed to pack bitmasks.", { cause });
  }
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
    const depth = reversePrefixMap[prefix];

    if (!depth) {
      throw new PermaskError("INVALID_PACKED_STRING", "Invalid packed string: unknown prefix.");
    }

    const base64String = urlSafe ? urlSafeToBase64(packed.substring(1)) : packed.substring(1);
    const bytes = decodeBase64(base64String);
    const bytesPerElement = depth >> 3;

    if (bytes.length % bytesPerElement !== 0) {
      throw new PermaskError("INVALID_PACKED_STRING", "Invalid packed string: invalid byte length.");
    }

    const resultLength = bytes.length / bytesPerElement;
    const result = new Array<number>(resultLength);

    for (let i = 0; i < resultLength; i++) {
      const offset = i * bytesPerElement;

      if (depth === 8) {
        result[i] = bytes[offset];
        continue;
      }

      if (depth === 16) {
        result[i] = bytes[offset] | (bytes[offset + 1] << 8);
        continue;
      }

      result[i] =
        (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
    }

    return result;
  } catch (cause) {
    throw cause instanceof PermaskError
      ? cause
      : new PermaskError("INVALID_PACKED_STRING", "Failed to unpack bitmasks.", { cause });
  }
}
