import { beforeAll, describe, expect, it } from "vitest";
import { packBitmasks, unpackBitmasks } from "../";

const generateBitmasks = () => {
  const bitmasks = new Set<number>();

  // Add some key test cases
  bitmasks.add(0);
  bitmasks.add(1);
  bitmasks.add(0xff); // 8 bits
  bitmasks.add(0xffff); // 16 bits
  bitmasks.add(0xffffff); // 24 bits
  bitmasks.add(0xffffffff); // 32 bits

  for (let i = 0; i < 31; i++) {
    bitmasks.add(1 << i);
  }

  bitmasks.add(0x12345678);
  bitmasks.add(0x55555555);
  bitmasks.add(0xaaaaaaaa);
  bitmasks.add(0x33333333);
  bitmasks.add(0xcccccccc);

  return Array.from(bitmasks);
};

describe("Pack/Unpack Bitmasks", () => {
  let bitmasks: number[];
  beforeAll(() => {
    bitmasks = generateBitmasks();
  });

  describe("packBitmasks", () => {
    it("should handle empty bitmasks array in packBitmasks", () => {
      const empty: number[] = [];
      const packed = packBitmasks(empty);

      expect(packed).toBe("");
    });

    it("should handle undefined bitmasks in packBitmasks", () => {
      // @ts-expect-error
      const packed = packBitmasks(undefined);

      expect(packed).toBe("");
    });

    it("should pack bitmasks correctly", () => {
      const packed = packBitmasks(bitmasks);

      expect(packed).toBeTypeOf("string");
      expect(packed.length).toBeGreaterThan(0);
      // valid base64
      expect(packed).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    });

    it("should pack bitmasks to url safe base64", () => {
      const packed = packBitmasks(bitmasks, true);

      expect(packed).toBeTypeOf("string");
      expect(packed.length).toBeGreaterThan(0);
      // valid url-safe base64
      expect(packed).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("unpackBitmasks", () => {
    it("should handle invalid base64", () => {
      const invalid = "!!!invalid-base64!!!";
      expect(() => unpackBitmasks(invalid)).toThrow();

      // Also test with urlSafe=true
      expect(() => unpackBitmasks(invalid, true)).toThrow();
    });

    it("should handle empty string in unpackBitmasks", () => {
      const result = unpackBitmasks("");
      expect(result).toEqual([]);
    });

    it("should unpack bitmasks correctly", () => {
      const packed = packBitmasks(bitmasks);
      const unpacked = unpackBitmasks(packed);
      expect(unpacked).toBeTypeOf("object");
      expect(unpacked).toBeInstanceOf(Array);
      expect(unpacked.length).toBe(bitmasks.length);
      expect(unpacked[0]).toBeTypeOf("number");
      expect(unpacked).toEqual(bitmasks);
    });

    it("should unpack bitmasks from url safe base64", () => {
      const packed = packBitmasks(bitmasks, true);
      const unpacked = unpackBitmasks(packed, true);

      expect(unpacked).toBeTypeOf("object");
      expect(unpacked).toBeInstanceOf(Array);
      expect(unpacked.length).toBe(bitmasks.length);
      expect(unpacked[0]).toBeTypeOf("number");
      expect(unpacked).toEqual(bitmasks);
    });

    it("should handle 8-bit depth (covers lines 14-17, 52)", () => {
      // Test 8-bit depth: max value < 256
      const bitmasks8bit = [0, 1, 127, 255];
      const packed = packBitmasks(bitmasks8bit);
      const unpacked = unpackBitmasks(packed);

      expect(packed).toMatch(/^A/); // Should start with "A" prefix for 8-bit
      expect(unpacked).toEqual(bitmasks8bit);
    });

    it("should handle 16-bit depth (covers lines 14-17, 52)", () => {
      // Test 16-bit depth: max value >= 256 but < 65536
      const bitmasks16bit = [0, 256, 1000, 65535];
      const packed = packBitmasks(bitmasks16bit);
      const unpacked = unpackBitmasks(packed);

      expect(packed).toMatch(/^B/); // Should start with "B" prefix for 16-bit
      expect(unpacked).toEqual(bitmasks16bit);
    });

    it("should handle 32-bit depth (covers lines 14-17, 52)", () => {
      // Test 32-bit depth: max value >= 65536
      const bitmasks32bit = [0, 65536, 1000000, 0xffffffff];
      const packed = packBitmasks(bitmasks32bit);
      const unpacked = unpackBitmasks(packed);

      expect(packed).toMatch(/^C/); // Should start with "C" prefix for 32-bit
      expect(unpacked).toEqual(bitmasks32bit);
    });
  });
});
