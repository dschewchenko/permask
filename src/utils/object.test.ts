import { describe, expect, it } from "vitest";
import { get } from "./object";

const testObject = {
  a: {
    b: {
      c: "value"
    },
    d: null,
    e: 0
  }
};

describe("Object Utilities", () => {
  describe("get", () => {
    it("should return the value at a single level path", () => {
      expect(get(testObject, "a")).toEqual(testObject.a);
    });

    it("should return the value at a two-level path", () => {
      expect(get(testObject, "a.b")).toEqual(testObject.a.b);
    });

    it("should return the value at a three-level path", () => {
      expect(get(testObject, "a.b.c")).toBe("value");
    });

    it("should return undefined if the path does not exist", () => {
      expect(get(testObject, "a.x")).toBeUndefined();
    });

    it("should return the default value if the path does not exist", () => {
      expect(get(testObject, "a.x", "default")).toBe("default");
    });

    it("should handle null values correctly", () => {
      expect(get(testObject, "a.d")).toBeNull();
    });

    it("should handle falsy values correctly", () => {
      expect(get(testObject, "a.e")).toBe(0);
    });

    it("should return the object itself if the path is empty", () => {
      expect(get(testObject, "")).toEqual(testObject);
    });

    it("should return the default value if the object is null or undefined", () => {
      expect(get(null, "a", "default")).toBe("default");
    });
  });
});
