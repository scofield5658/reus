# reus.js 项目指南

## 项目定位

reus.js 是基于 Koa 2 的应用框架和 CLI。它通过约定式配置、Controller、Middleware、路由描述和构建命令，减少使用方直接组装 Koa 应用的工作量。

当前版本面向 Node.js 18 及以上环境，包本身使用 ES Module。运行时只公开导出 `Controller` 和 `Middleware`；项目配置、路由及上下文辅助方法的类型定义位于 `types/index.d.ts`。

## 目录和入口

- `command.js`、`commands/`：`create`、`build`、`launch` 命令。
- `bin/shell.js`：npm 安装后生成的 `reus` 命令入口。
- `bin/app.js`：生产运行入口，可由 PM2 直接执行。
- `src/app.js`：Koa 应用初始化和监听逻辑。
- `src/models/`：Controller、Middleware 及响应模型。
- `src/helpers/`：注入 `ctx.json` 和 `ctx.http`。
- `src/utils.js`：普通路由、代理路由和中间件注册。
- `.config/`：框架默认项目配置。
- `.gulpfiles/`：使用方项目的构建和开发模式任务。
- `common.js`：读取使用方配置、插件和项目路径。
- `test/`：基于 `node:test` 的框架测试、类型测试和使用方验证脚本。

## 使用方项目

使用方根目录通过 `project.config.json` 覆盖框架配置，常用配置包括 `app`、`upload`、`browserSync`、`koaConfig` 和 `plugins`。

应用配置文件位于：

- 开发模式：`src/app.config.js`
- 生产模式：`dist/app.config.js`

应用配置可以声明 `startups`、`middlewares`、`routers` 和 Swagger 相关选项。路由使用对象描述，支持嵌套路径、HTTP method、Controller、Middleware、限流、静态视图和代理配置。

## 运行方式

```bash
# 开发模式
reus launch . --mode dev

# 构建使用方的 src 到 dist
reus build .

# 生产模式，launch 默认使用 prod
reus launch .
```

开发模式读取 `src/app.config.js` 并由 nodemon 监听代码变化。BrowserSync 默认关闭，只有 `project.config.json` 中的 `browserSync.enabled` 为 `true` 时才会并行启动。

构建命令使用 Babel 将使用方的 `src/` 输出到 `dist/`，并执行已配置插件提供的构建任务。生产模式读取 `dist/app.config.js`，因此部署产物需要包含构建后的 `dist/`。

PM2 可以直接运行 `node_modules/reus.js/bin/app.js`。这种方式需要设置 `REUS_PROJECT_DIR` 和 `REUS_PROJECT_ENV=prod`，uniweb-manager 当前采用的就是这一入口。

## 启动流程

生产或开发入口启动后，框架按以下顺序组装应用：

1. 读取 `project.config.json` 和对应环境的 `app.config.js`。
2. 按声明顺序执行 `startups`。
3. 创建 Koa 实例并注册 Swagger、全局 Middleware 和代理路由。
4. 注册请求体解析、`ctx.json`、`ctx.http`、插件和普通路由。
5. 为代理 Router 和普通 Router 注册 `allowedMethods()`。
6. 监听 `project.config.json` 中的 `app.port`。

`ctx.http` 使用 Node.js 原生 fetch，返回 `{ headers, data, status_code }`。HTTP 非 2xx 响应正常 resolve；网络错误和显式超时 reject。

## 本地检查

```bash
pnpm lint
pnpm test
pnpm types
pnpm audit
pnpm pack-smoke

# 执行全部检查
pnpm check
```

测试使用临时项目 fixture，不依赖长期运行的服务。`test/consumer/validate.mjs` 用于在隔离副本中安装 tarball，并验证 uniweb-manager 或 uniweb-admin；它不会修改使用方源仓。

## 仓库约定

- `README.md` 记录使用方式，`CHANGELOG.md` 记录版本变化。
- `docs/` 是本地过程资料目录，已被 Git 忽略。
- npm tag 和 npm publish 由维护者执行，不属于常规代码检查。
- 修改运行行为时，同步更新对应测试和类型声明；涉及使用方行为时，使用隔离副本完成回归。
