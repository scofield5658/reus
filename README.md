# reus.js

reus.js 是面向 Koa 2 应用的轻量二次封装。它统一项目配置、启动任务、请求体解析、Controller/Middleware、路由、代理、Swagger、开发进程和构建流程，让使用方聚焦业务代码。

## 环境与安装

- Node.js 18+
- Koa 2
- 项目使用 ESM（`package.json` 中设置 `"type": "module"`）

```bash
pnpm add reus.js
```

## CLI

```bash
# 从 starter 创建项目
reus create -t simple

# 开发模式：默认只启动 nodemon
reus launch . --mode dev

# 构建 src 到 dist
reus build .

# 生产模式（launch 的默认模式）
reus launch .
```

命令的子进程失败会返回非零退出码。`create` 会校验下载状态、等待解压完成，并在成功或失败后清理临时文件。

## 最小项目

`project.config.json`：

```json
{
  "app": {
    "port": 8090
  },
  "browserSync": {
    "enabled": false
  }
}
```

`src/app.config.js`：

```js
import routers from './routers.js';
import RequestLog from './middlewares/request-log.js';

export default {
  startups: [
    async () => {
      // 在 Koa 创建和 listen 之前顺序执行
    },
  ],
  middlewares: [RequestLog],
  routers,
  swaggerYmlFile: './swagger.yml',
};
```

`src/routers.js`：

```js
import HelloController from './controllers/hello.js';

export default [
  {
    path: '/hello',
    method: 'get',
    controller: HelloController,
  },
];
```

Controller 与 Middleware：

```js
import { Controller, Middleware } from 'reus.js';

export class HelloController extends Controller {
  async index() {
    this.ctx.json({ message: 'hello' });
  }
}

export class RequestLog extends Middleware {
  async index() {
    console.log(this.ctx.method, this.ctx.url);
    return this.next();
  }
}
```

## 上下文 helper

`ctx.json(value)` 将响应设置为 JSON。

`ctx.http(options)` 基于 Node 原生 `fetch`，支持 `uri/url`、`qs`、`method`、`headers`、`body`、`json`、显式 `timeout` 和 `encoding: null`：

```js
const response = await ctx.http({
  uri: 'http://127.0.0.1:8080/orders',
  method: 'POST',
  body: { side: 'BUY' },
});

// response: { headers, data, status_code }
```

HTTP 4xx/5xx 会 resolve；网络错误和显式超时会 reject。框架不设置默认超时。

## 路由协议

路由始终启用 `allowedMethods`：

- method 不匹配返回 405 与 `Allow`；
- OPTIONS 自动响应；
- 不支持的方法可能返回 501；
- 未知路径保持 404。

正确 method/path 的 Controller 请求不受影响。

## BrowserSync

BrowserSync 与 nodemon 是两个独立工具。默认只启动 nodemon；仅当下面的配置显式开启时，BrowserSync 才并行启动，并代理真实的 `app.port`：

```json
{
  "browserSync": {
    "enabled": true,
    "port": 3001,
    "ui_port": 10000,
    "files": ["src/pages/**/*"]
  }
}
```

## License

[MIT](LICENSE)
