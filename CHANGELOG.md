# Changelog

## 6.0.0 - 2026-07-21

### 破坏性变更

- 运行时基线升级至 Node.js 22.22.0，Volta 固定使用该版本。
- Koa 升级至 3.2，路由实现由已废弃的 `koa-router` 迁移至 `@koa/router` 15。

### 兼容与升级

- 框架内部兼容原有路由配置中的正则字符串（例如 `/api/(.*)`），使用方无需修改路由代码。
- 请求体、挂载和连接适配层升级至 `koa-body` 8、`koa-mount` 4.2、`koa-connect` 2.1；代理适配至 `http-proxy-middleware` 4，并保留既有超时、路径重写、错误响应和 `loglevel` 配置语义。
- 同步更新 Koa 3 类型，并提高锁文件中的间接依赖修复版本。
- 框架实现迁移至 TypeScript，并发布编译后的 `dist/` JavaScript 与声明文件；现有 JavaScript 使用方无需改动。
- npm 发布工作流升级至 Node.js 22.22.0，在打包和发布前执行完整 `pnpm check`。

## 5.1.0 - 2026-07-17

### 兼容保持

- 保持 Node 18、Koa 2、Controller/Middleware、startup 顺序、正确业务路由、请求体、`ctx.json`、代理和 prod launch 行为。
- `ctx.http` 保持 `{ headers, data, status_code }`，HTTP 非 2xx 继续 resolve，网络错误继续 reject；兼容 `qs` 的空值/数组编码、`json: false`、JSON 标量请求体与重复 `Set-Cookie` 响应头。

### 修复

- 正确安装 `allowedMethods`，补齐 405、OPTIONS、501 与 `Allow`。
- 修复 Swagger YAML fallback 和 `spec` 拼写，显式 URL/spec 优先。
- BrowserSync 改为显式启用，代理真实应用端口，并保护 reload。
- build/dev 子进程传播 spawn 错误和非零退出码。
- `reus create` 使用原生 fetch，校验状态、等待解压并清理临时文件。

### 工程

- 移除 `request`、`request-promise`，升级兼容范围内的 Koa、代理、开发工具、Swagger、unzipper、Babel、ESLint 与类型依赖。
- 新增 node:test、公开类型验证、生产依赖审计、发布物 smoke 和使用方隔离回归入口。
