import {beforeAll, describe, expect, it } from "vitest";
import { packBitmasks, unpackBitmasks } from "../"

const generateBitmasks = () => {
  const bitmasks = new Set<number>();

  // Add some key test cases
  bitmasks.add(0);
  bitmasks.add(1);
  bitmasks.add(0xFF);       // 8 bits
  bitmasks.add(0xFFFF);     // 16 bits
  bitmasks.add(0xFFFFFF);   // 24 bits
  bitmasks.add(0xFFFFFFFF); // 32 bits

  for (let i = 0; i < 31; i++) {
    bitmasks.add(1 << i);
  }

  bitmasks.add(0x12345678);
  bitmasks.add(0x55555555);
  bitmasks.add(0xAAAAAAAA);
  bitmasks.add(0x33333333);
  bitmasks.add(0xCCCCCCCC);

  return Array.from(bitmasks)
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
      const result = unpackBitmasks(invalid);

      expect(result).toEqual([]);

      // Also test with urlSafe=true
      const resultUrlSafe = unpackBitmasks(invalid, true);

      expect(resultUrlSafe).toEqual([]);
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
  });
});
