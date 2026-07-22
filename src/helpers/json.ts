import type { Context, Next } from 'koa';

export default function (ctx: Context, next: Next) {
  const handleJson = function (data: unknown) {
    ctx.type = 'application/json;charset=utf-8';
    ctx.body = JSON.stringify(data);
  };

  ctx.json = handleJson;
  return next();
}
