import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { hasRequiredPermission } from "../../utils/bitmask";
import {
  defaultPermaskNestjsOptions,
  type NestRequestLike,
  type PermaskNestjsOptions,
  type PermaskRequirement
} from "./options";

export type { NestRequestLike, PermaskNestjsOptions, PermaskRequirement } from "./options";
export { defaultPermaskNestjsOptions } from "./options";

type ReflectWithMetadata = typeof Reflect & {
  defineMetadata?: (
    metadataKey: unknown,
    metadataValue: unknown,
    target: unknown,
    propertyKey?: string | symbol
  ) => void;
  getMetadata?: (metadataKey: unknown, target: unknown, propertyKey?: string | symbol) => unknown;
};

/**
 * Metadata key used by {@link Permask} and {@link PermaskGuard}.
 */
export const PERMASK_NESTJS_METADATA_KEY = Symbol.for("permask:nestjs:requirements");

function assertReflectMetadata(reflect: ReflectWithMetadata) {
  if (typeof reflect.defineMetadata !== "function" || typeof reflect.getMetadata !== "function") {
    throw new Error(
      'Permask NestJS integration requires "reflect-metadata" (Reflect.defineMetadata/getMetadata is missing).'
    );
  }
}

function getRequirements(target: unknown): PermaskRequirement[] | undefined {
  const reflect = Reflect as ReflectWithMetadata;
  assertReflectMetadata(reflect);
  return reflect.getMetadata(PERMASK_NESTJS_METADATA_KEY, target) as PermaskRequirement[] | undefined;
}

function setRequirements(target: unknown, requirements: PermaskRequirement[]) {
  const reflect = Reflect as ReflectWithMetadata;
  assertReflectMetadata(reflect);
  reflect.defineMetadata(PERMASK_NESTJS_METADATA_KEY, requirements, target);
}

function normalizeRequirements(
  groupOrRequirements: number | PermaskRequirement[],
  accessMask?: number
): PermaskRequirement[] {
  if (Array.isArray(groupOrRequirements)) return groupOrRequirements;
  return [{ group: groupOrRequirements, accessMask: accessMask ?? 0 }];
}

/**
 * NestJS decorator to attach required permissions to a controller class or a route handler.
 *
 * Use together with {@link PermaskGuard} (or with a guard created via {@link createPermaskNestjsGuard}).
 *
 * @example
 * ```ts
 * import "reflect-metadata";
 * import { APP_GUARD } from "@nestjs/core";
 * import { Controller, Get, Module } from "@nestjs/common";
 * import { PermissionAccess } from "permask";
 * import { Permask, PermaskGuard } from "permask/nestjs";
 *
 * const groups = { admin: 1 } as const;
 *
 * // Best practice: register the guard globally once (no need to repeat @UseGuards(...) on every controller).
 * @Module({
 *   providers: [{ provide: APP_GUARD, useClass: PermaskGuard }]
 * })
 * export class AppModule {}
 *
 * // Decorate a controller to apply requirements to all its routes.
 * @Permask(groups.admin, PermissionAccess.READ)
 * @Controller("posts")
 * export class PostsController {
 *   @Get()
 *   findAll() {
 *     return "ok";
 *   }
 * }
 * ```
 */
export function Permask(group: number, accessMask: number): MethodDecorator & ClassDecorator;
export function Permask(requirements: PermaskRequirement[]): MethodDecorator & ClassDecorator;
export function Permask(
  groupOrRequirements: number | PermaskRequirement[],
  accessMask?: number
): MethodDecorator & ClassDecorator {
  const requirements = normalizeRequirements(groupOrRequirements, accessMask);

  return (target: object, _propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    const decoratedTarget = descriptor?.value ?? target;
    setRequirements(decoratedTarget, requirements);
  };
}

/**
 * Create a `PermaskGuard` class with custom options (e.g. how to resolve permissions from the request).
 *
 * @example
 * ```ts
 * import { APP_GUARD } from "@nestjs/core";
 * import { Module } from "@nestjs/common";
 * import { createPermaskNestjsGuard } from "permask/nestjs";
 *
 * const PermaskAccessGuard = createPermaskNestjsGuard({
 *   // Your auth guard should run earlier and set `req.user.permissions` (number[] bitmasks).
 *   getPermissions: (_opts, req) => (req as any).user?.permissions ?? []
 * });
 *
 * @Module({
 *   providers: [{ provide: APP_GUARD, useClass: PermaskAccessGuard }]
 * })
 * export class AppModule {}
 * ```
 */
export function createPermaskNestjsGuard(opts?: PermaskNestjsOptions): new () => CanActivate {
  const options = { ...defaultPermaskNestjsOptions, ...opts };

  return class PermaskGuard implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const handler = context.getHandler();
      const klass = context.getClass();
      const handlerRequirements = handler ? getRequirements(handler) : undefined;
      const classRequirements = klass ? getRequirements(klass) : undefined;
      const requirements = handlerRequirements ?? classRequirements;

      if (!requirements?.length) return true;

      const request = (context.switchToHttp().getRequest() ?? {}) as NestRequestLike;
      const bitmasks = await options.getPermissions(options, request);

      return requirements.some((req) => hasRequiredPermission(bitmasks, req.group, req.accessMask));
    }
  };
}

/**
 * Default NestJS guard (uses {@link defaultPermaskNestjsOptions}).
 */
export const PermaskGuard = createPermaskNestjsGuard();

/**
 * NestJS decorator returned by {@link permaskNestjs}.
 */
export type PermaskNestjsDecorator<Groups extends Record<string, number | string>> = {
  /**
   * Attach a single permission requirement to a controller/handler.
   */
  (group: Groups[keyof Groups], accessMask: number): MethodDecorator & ClassDecorator;

  /**
   * Attach multiple alternative requirements (any-of).
   */
  (requirements: PermaskRequirement[]): MethodDecorator & ClassDecorator;
};

/**
 * NestJS helpers returned by {@link permaskNestjs}.
 */
export type PermaskNestjsIntegration<Groups extends Record<string, number | string>> = {
  /**
   * Decorator to attach required permissions to a controller class or a route handler.
   *
   * The guard checks handler metadata first, then falls back to class metadata.
   */
  Permask: PermaskNestjsDecorator<Groups>;

  /**
   * Guard class compatible with `@UseGuards(...)`.
   *
   * Returns `true` when allowed, otherwise returns `false` (Nest turns this into 403).
   */
  PermaskGuard: new () => CanActivate;
};

/**
 * Create NestJS helpers for Permask:
 * - `Permask(...)` decorator
 * - `PermaskGuard` guard class
 *
 * Notes:
 * - Requires `reflect-metadata` to be loaded by the Nest app (e.g. `import "reflect-metadata";` in `main.ts`).
 *
 * @example
 * ```ts
 * import "reflect-metadata";
 * import { APP_GUARD } from "@nestjs/core";
 * import { Controller, Get, Module } from "@nestjs/common";
 * import { PermissionAccess } from "permask";
 * import { permaskNestjs } from "permask/nestjs";
 *
 * const groups = { admin: 1 } as const;
 *
 * // Your auth guard (e.g. JwtAuthGuard) should run before PermaskGuard
 * // and populate `req.user.permissions` (number[] bitmasks).
 * const { Permask, PermaskGuard } = permaskNestjs(groups, {
 *   getPermissions: (_opts, req) => (req as any).user?.permissions ?? []
 * });
 *
 * // Register globally (recommended). Make sure your auth guard runs earlier and populates `req.user.permissions`.
 * @Module({
 *   providers: [{ provide: APP_GUARD, useClass: PermaskGuard }]
 * })
 * export class AppModule {}
 *
 * @Permask(groups.admin, PermissionAccess.READ) // applies to all routes in this controller
 * @Controller("posts")
 * export class PostsController {
 *   @Get()
 *   findAll() {
 *     return "ok";
 *   }
 * }
 * ```
 */
export function permaskNestjs<Groups extends Record<string, number | string>>(
  _groups: Groups,
  opts?: PermaskNestjsOptions
): PermaskNestjsIntegration<Groups> {
  const PermaskTyped = ((groupOrRequirements: Groups[keyof Groups] | PermaskRequirement[], accessMask?: number) => {
    if (Array.isArray(groupOrRequirements)) {
      return Permask(groupOrRequirements);
    }
    return Permask(groupOrRequirements as number, accessMask as number);
  }) as PermaskNestjsDecorator<Groups>;

  const PermaskGuardTyped = createPermaskNestjsGuard(opts);

  return { Permask: PermaskTyped, PermaskGuard: PermaskGuardTyped };
}
