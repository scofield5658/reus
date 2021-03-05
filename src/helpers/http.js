const rp = require('request-promise');

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

module.exports = function(ctx, next) {
  ctx.http = http;
  return next();
};
