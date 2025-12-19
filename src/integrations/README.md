# permask integrations

Integrations are thin adapters that keep `permask` core framework-agnostic.
They follow each framework’s native authorization/guard pattern and only bridge:
request context → `number[]` bitmasks → “forbidden” response/error.

All integrations assume you authenticate earlier in the pipeline and attach `number[]` permission bitmasks to the request/context
(defaults + customization via `getPermissions(...)` are available in each integration).

## Integrations

- [Express](#express) — `permask/express`
- [Fastify](#fastify) — `permask/fastify`
- [H3](#h3) — `permask/h3`
- [Nitro](#nitro) — `permask/nitro`
- [NestJS](#nestjs) — `permask/nestjs`
- [Hono](#hono) — `permask/hono`
- [Koa](#koa) — `permask/koa`
- [itty-router](#itty-router) — `permask/itty-router`
- [Elysia](#elysia) — `permask/elysia`

## Common setup

```ts
import { PermissionAccess } from "permask";

const groups = { POST: 1 } as const;
```

## Express

```ts
import { permaskExpress } from "permask/express";

const check = permaskExpress(groups);
app.get("/posts", check(groups.POST, PermissionAccess.READ), handler);
```

## Fastify

```ts
import { permaskFastify } from "permask/fastify";

const check = permaskFastify(groups);
fastify.get("/posts", { preHandler: check(groups.POST, PermissionAccess.READ) }, handler);
```

## H3

```ts
import { permaskH3 } from "permask/h3";

const { requirePermask } = permaskH3(groups);
await requirePermask(event, groups.POST, PermissionAccess.READ);
```

## Nitro

```ts
// server/api/posts.get.ts
import { defineEventHandler } from "h3";
import { permaskNitro } from "permask/nitro";

const { protect } = permaskNitro(groups);
export default protect(groups.POST, PermissionAccess.READ, defineEventHandler(() => "ok"));
```

## NestJS

```ts
import "reflect-metadata";
import { APP_GUARD } from "@nestjs/core";
import { Controller, Get, Module } from "@nestjs/common";
import { Permask, createPermaskNestjsGuard } from "permask/nestjs";

const PermaskAccessGuard = createPermaskNestjsGuard({
  // Auth guard should run earlier and set `req.user.permissions` (number[] bitmasks).
  getPermissions: (_opts, req) => (req as any).user?.permissions ?? []
});

@Module({
  providers: [{ provide: APP_GUARD, useClass: PermaskAccessGuard }]
})
export class AppModule {}

@Permask(groups.POST, PermissionAccess.READ) // applies to all routes in this controller
@Controller("posts")
export class PostsController {
  @Get()
  @Permask(groups.POST, PermissionAccess.READ) // applies to this route only
  findAll() {
    return "ok";
  }
}
```

## Hono

```ts
import { Hono } from "hono";
import { permaskHono } from "permask/hono";

const app = new Hono();
const check = permaskHono(groups);
app.get("/posts", check(groups.POST, PermissionAccess.READ), handler);
```

## Koa

```ts
import { permaskKoa } from "permask/koa";

const check = permaskKoa(groups);
app.use(check(groups.POST, PermissionAccess.READ));
```

## itty-router

```ts
import { Router } from "itty-router";
import { permaskIttyRouter } from "permask/itty-router";

const router = Router();
const check = permaskIttyRouter(groups);
router.before(check(groups.POST, PermissionAccess.READ));
```

## Elysia

```ts
import { Elysia } from "elysia";
import { permaskElysia } from "permask/elysia";

const check = permaskElysia(groups);
new Elysia().get("/posts", handler, { beforeHandle: check(groups.POST, PermissionAccess.READ) });
```

See each integration’s JSDoc for options and framework-specific notes.
