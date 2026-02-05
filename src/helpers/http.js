import rp from 'request-promise';

const http = async (opts) => {
  const response = await rp({
    json: true,
    ...opts,
    resolveWithFullResponse: true,
    simple: false,
  });
  const { body: data, headers, statusCode: status_code } = response;
  return { headers, data, status_code };
};

export default function (ctx, next) {
  ctx.http = http;
  return next();
}
