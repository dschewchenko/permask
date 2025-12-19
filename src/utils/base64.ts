import { PermaskError } from "../errors";

export const base64ToUrlSafe = (base64: string) => base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

export const urlSafeToBase64 = (base64: string) => {
  const normalized = base64.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = normalized.length % 4;
  return padLength === 0 ? normalized : normalized + "=".repeat(4 - padLength);
};

export function encodeBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }

  if (typeof btoa !== "function") {
    throw new PermaskError("BASE64_UNAVAILABLE", "Missing base64 encoder (btoa/Buffer) in this runtime.");
  }

  const chunkSize = 0x8000;
  let binaryString = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binaryString += String.fromCharCode(...chunk);
  }

  return btoa(binaryString);
}

export function decodeBase64(base64: string): Uint8Array {
  if (typeof atob === "function") {
    try {
      const binaryString = atob(base64);

      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return bytes;
    } catch (cause) {
      throw new PermaskError("INVALID_PACKED_STRING", "Invalid packed string: invalid base64 payload.", { cause });
    }
  } else if (typeof Buffer !== "undefined") {
    try {
      return new Uint8Array(Buffer.from(base64, "base64"));
    } catch (cause) {
      throw new PermaskError("INVALID_PACKED_STRING", "Invalid packed string: invalid base64 payload.", { cause });
    }
  }

  throw new PermaskError("BASE64_UNAVAILABLE", "Missing base64 decoder (atob/Buffer) in this runtime.");
}
