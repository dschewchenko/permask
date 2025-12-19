import { describe, expect, it, vi } from "vitest";
import { PermissionAccess } from "../../constants/permission";
import { createBitmask } from "../../utils/bitmask";
import {
  PERMASK_NESTJS_METADATA_KEY,
  Permask,
  PermaskGuard,
  createPermaskNestjsGuard,
  permaskNestjs
} from "./";

const groups = {
  POST: 1,
  COMMENT: 2
} as const;

function createExecutionContext(params: { handler?: unknown; klass?: unknown; request?: unknown }) {
  return {
    getHandler: () => params.handler,
    getClass: () => params.klass,
    switchToHttp: () => ({
      getRequest: () => params.request
    })
  } as any;
}

describe("permask NestJS integration", () => {
  it("throws a helpful error when reflect-metadata is not loaded", () => {
    const reflect = Reflect as any;
    const originalDefineMetadata = reflect.defineMetadata;
    const originalGetMetadata = reflect.getMetadata;

    reflect.defineMetadata = undefined;
    reflect.getMetadata = undefined;

    try {
      expect(() => Permask(groups.POST, PermissionAccess.READ)(class {})).toThrow(/reflect-metadata/);
    } finally {
      reflect.defineMetadata = originalDefineMetadata;
      reflect.getMetadata = originalGetMetadata;
    }
  });

  it("supports class-level requirements for all routes", async () => {
    await import("reflect-metadata");

    class PostsController {
      findAll() {
        return "ok";
      }
    }

    Permask(groups.POST, PermissionAccess.READ)(PostsController);

    const request = { user: { permissions: [createBitmask({ group: groups.POST, read: true })] } };
    const context = createExecutionContext({ klass: PostsController, request });

    const guard = new PermaskGuard();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("supports method-level requirements and they override class requirements", async () => {
    await import("reflect-metadata");

    class PostsController {
      findAll() {
        return "ok";
      }
    }

    // class-level: allow POST:read
    Permask(groups.POST, PermissionAccess.READ)(PostsController);

    // method-level: require COMMENT:read
    const descriptor = Object.getOwnPropertyDescriptor(PostsController.prototype, "findAll") as PropertyDescriptor;
    Permask(groups.COMMENT, PermissionAccess.READ)(PostsController.prototype, "findAll", descriptor);

    const request = { user: { permissions: [createBitmask({ group: groups.POST, read: true })] } };
    const context = createExecutionContext({ handler: descriptor.value, klass: PostsController, request });

    const guard = new PermaskGuard();
    await expect(guard.canActivate(context)).resolves.toBe(false);
  });

  it("can be configured via createPermaskNestjsGuard(getPermissions)", async () => {
    await import("reflect-metadata");

    class PostsController {
      findAll() {
        return "ok";
      }
    }

    Permask(groups.POST, PermissionAccess.READ)(PostsController);

    const request = { auth: { perms: [createBitmask({ group: groups.POST, read: true })] } };
    const context = createExecutionContext({ klass: PostsController, request });

    const Guard = createPermaskNestjsGuard({
      getPermissions: (_opts, req) => (req as any).auth?.perms ?? []
    });

    const guard = new Guard();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("treats missing requirements as public (does not call getPermissions)", async () => {
    await import("reflect-metadata");

    const getPermissions = vi.fn().mockResolvedValue([]);

    const Guard = createPermaskNestjsGuard({ getPermissions });
    const guard = new Guard();

    const context = createExecutionContext({ handler: () => "ok", klass: class {}, request: {} });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(getPermissions).not.toHaveBeenCalled();
  });

  it("supports passing multiple alternative requirements", async () => {
    await import("reflect-metadata");

    class PostsController {
      findAll() {
        return "ok";
      }
    }

    Permask([
      { group: groups.POST, accessMask: PermissionAccess.READ },
      { group: groups.COMMENT, accessMask: PermissionAccess.READ }
    ])(PostsController);

    const meta = Reflect.getMetadata(PERMASK_NESTJS_METADATA_KEY, PostsController) as unknown;
    expect(Array.isArray(meta)).toBe(true);

    const request = { user: { permissions: [createBitmask({ group: groups.COMMENT, read: true })] } };
    const context = createExecutionContext({ klass: PostsController, request });

    const guard = new PermaskGuard();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("permaskNestjs(...) factory returns decorator + guard", async () => {
    await import("reflect-metadata");

    const { Permask: PermaskTyped, PermaskGuard: GuardTyped } = permaskNestjs(groups);

    class PostsController {
      findAll() {
        return "ok";
      }
    }

    PermaskTyped(groups.POST, PermissionAccess.READ)(PostsController);

    const request = { user: { permissions: [createBitmask({ group: groups.POST, read: true })] } };
    const context = createExecutionContext({ klass: PostsController, request });

    const guard = new GuardTyped();
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
