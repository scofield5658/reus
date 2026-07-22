import qsStringify from 'qs';
import type { Context, Next } from 'koa';

import type { HttpOptions, HttpResponse } from '../../types/index.js';

const buildUrl = (baseUrl: string, qs?: Record<string, unknown>) => {
  if (!qs || typeof qs !== 'object' || Object.keys(qs).length === 0) {
    return baseUrl;
  }
  const searchParams = qsStringify.stringify(qs);
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${searchParams}`;
};

const hasHeader = (headers: Record<string, string>, name: string) => Object.keys(headers)
  .some((header) => header.toLowerCase() === name.toLowerCase());

const http = async <T = unknown>(opts: HttpOptions = {}): Promise<HttpResponse<T>> => {
  const url = buildUrl(opts.uri || opts.url || '', opts.qs);
  const method = (opts.method || 'GET').toUpperCase();
  const headers = { ...opts.headers };
  const json = opts.json !== false;
  if (json && !hasHeader(headers, 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }

  let body: BodyInit | undefined = opts.body as BodyInit | undefined;
  if (json && body !== undefined) {
    body = JSON.stringify(body);
  }

  const fetchOptions: RequestInit = {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  };
  if (opts.timeout !== undefined) {
    fetchOptions.signal = AbortSignal.timeout(opts.timeout);
  }

  const response = await fetch(url, fetchOptions);
  let data: T | undefined;
  if (opts.encoding === null) {
    data = Buffer.from(await response.arrayBuffer()) as T;
  } else {
    const text = await response.text();
    if (text) {
      if (!json) {
        data = text as T;
      } else {
        try {
          data = JSON.parse(text) as T;
        } catch {
          data = text as T;
        }
      }
    }
  }

  const responseHeaders: Record<string, string | string[]> = {};
  for (const [name, value] of response.headers.entries()) {
    if (name === 'set-cookie') {
      responseHeaders[name] = [
        ...(responseHeaders[name] || []),
        value,
      ];
    } else {
      responseHeaders[name] = value;
    }
  }
  const setCookies = response.headers.getSetCookie?.();
  if (setCookies?.length) {
    responseHeaders['set-cookie'] = setCookies;
  }
  const status_code = response.status;
  const result = { headers: responseHeaders, data, status_code };
  return result;
};

export default function (ctx: Context, next: Next) {
  ctx.http = http;
  return next();
}
