import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PermissionAccess } from "../../constants/permission";
import { createBitmask } from "../../utils/bitmask";
import { defaultPermaskMiddlewareOptions, permaskExpress } from "./";

const groups = {
  POSTS: 1,
  COMMENTS: 2
};

describe("permask Express Middleware", () => {
  const mockRequest = (permissions: number[]) =>
    ({
      user: { permissions }
    }) as unknown as Request;

  const mockResponse = () => {
    const res = {} as Response;
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    res.send = vi.fn().mockReturnValue(res);

    return res;
  };

  const mockNext = vi.fn() as NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow access if the user has the required permission", () => {
    const checkPermission = permaskExpress(groups);
    const req = mockRequest([createBitmask({ group: groups.POSTS, read: true })]);
    const res = mockResponse();

    checkPermission(groups.POSTS, PermissionAccess.READ)(req, res, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should deny access if the user does not have the required permission", () => {
    const checkPermission = permaskExpress(groups);
    const req = mockRequest([createBitmask({ group: groups.POSTS, read: true })]);
    const res = mockResponse();

    checkPermission(groups.POSTS, PermissionAccess.WRITE)(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Access denied"
    });
  });

  it("should handle missing permissions gracefully", () => {
    const checkPermission = permaskExpress(groups);
    const req = mockRequest([]);
    const res = mockResponse();

    checkPermission(groups.POSTS, PermissionAccess.DELETE)(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Access denied"
    });
  });

  it("should return 500 if an error occurs during permission checking", () => {
    const checkPermission = permaskExpress(groups, {
      ...defaultPermaskMiddlewareOptions,
      getPermissions: () => {
        throw new Error("Test error"); // Емітуємо помилку
      }
    });

    const req = mockRequest([createBitmask({ group: groups.POSTS, read: true })]);
    const res = mockResponse();

    checkPermission(groups.POSTS, PermissionAccess.READ)(req, res, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
      details: "Test error"
    });
  });
});
