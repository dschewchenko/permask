import { describe, expect, it } from "vitest";
import { findPathValue, readPermissionBitmasks } from "./object";

const testObject = {
  a: {
    b: { c: "value" },
    d: null,
    e: 0
  }
};

describe("Object path lookup", () => {
  it("reads a single-level path", () => {
    expect(findPathValue(testObject, "a")).toEqual({ found: true, value: testObject.a });
  });

  it("reads a two-level path", () => {
    expect(findPathValue(testObject, "a.b")).toEqual({ found: true, value: testObject.a.b });
  });

  it("reads a three-level path", () => {
    expect(findPathValue(testObject, "a.b.c")).toEqual({ found: true, value: "value" });
  });

  it("distinguishes missing paths", () => {
    expect(findPathValue(testObject, "a.x")).toEqual({ found: false });
  });

  it("defaults to an empty bitmask array when the configured property is missing", () => {
    expect(readPermissionBitmasks(testObject, "a.x")).toEqual([]);
  });

  it("preserves an existing null value", () => {
    expect(findPathValue(testObject, "a.d")).toEqual({ found: true, value: null });
  });

  it("preserves an existing falsy value", () => {
    expect(findPathValue(testObject, "a.e")).toEqual({ found: true, value: 0 });
  });

  it("returns the object for an empty path", () => {
    expect(findPathValue(testObject, "")).toEqual({ found: true, value: testObject });
  });

  it("distinguishes missing and null sources from existing properties", () => {
    expect(findPathValue(null, "a")).toEqual({ found: false });
    expect(findPathValue(undefined, "a")).toEqual({ found: false });
  });

  it("returns the configured bitmasks from inherited getters", () => {
    class AuthenticatedRequest {
      readonly masks = [1, 2];

      get authentication() {
        return { authorizations: this.masks };
      }
    }

    const request = new AuthenticatedRequest();
    expect(readPermissionBitmasks(request, "authentication.authorizations")).toBe(request.masks);
    expect(readPermissionBitmasks(request, "authentication.missing")).toEqual([]);
  });
});
