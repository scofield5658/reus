# Changelog

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
