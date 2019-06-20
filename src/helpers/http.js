const rp = require('request-promise');

const http = async (opts) => {
  const response = await rp({
    ...opts,
    resolveWithFullResponse: true,
    simple: false,
  });
  const { body: data, headers, statusCode: status_code } = response;
  if (status_code !== 200) {
    throw { headers, data, status_code };
  }

  return { headers, data, status_code };
};

module.exports = function(ctx, next) {
  ctx.http = http;
  return next();
};
