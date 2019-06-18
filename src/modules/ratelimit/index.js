/**
 * Module dependencies.
 */

const { RateLimiterMongo: MongoLimiter, RateLimiterMemory: MemoryLimiter } = require('rate-limiter-flexible');

/**
 * Initialize ratelimit middleware with the given `opts`:
 *
 * - `type` type of limiter you use [memory]
 * - `duration` limit duration in milliseconds [1 second]
 * - `max` max requests per `id` [4]
 * - `dbConn` database connection
 * - `tableName` database name ['gt-rtlmt']
 * - `id` id to compare requests [ip]
 * - `headers` custom header names
 * - `whitelist` whitelist function [false]
 * - `blacklist` blacklist function [false]
 *
 * @param {Object} opts
 * @return {Function}
 * @api public
 */

function ratelimit(opts = { type: 'memory' }) {
  let limiter = null;
  if (!opts.type || opts.type === 'memory') {
    limiter = new MemoryLimiter({
      duration: opts.duration || 1,
      points: opts.max || 5,
    });
  } else if (opts.type === 'mongo') {
    limiter = new MongoLimiter({
      storeClient: opts.dbConn,
      keyPrefix: opts.tableName || 'gt-rtlmt',
      duration: opts.duration || 1,
      points: opts.max || 5,
    });
  }

  return async function ratelimit(ctx, next) {
    const id = opts.id ? opts.id(ctx) : ctx.ip;
    const whitelisted = typeof opts.whitelist === 'function' ? await opts.whitelist(ctx) : false;
    const blacklisted = typeof opts.blacklist === 'function' ? await opts.blacklist(ctx) : false;

    if (blacklisted) {
      ctx.throw(403, 'Forbidden');
    }

    if (false === id || whitelisted) return await next();

    if (!limiter) {
      throw new Error('invalid type of opts for limiter');
    }

    const timestamp = Date.now();

    try {
      const item2 = await limiter.consume(id, 1);
      const headers = {
        'Retry-After': item2.msBeforeNext / 1000,
        'X-RateLimit-Limit': opts.max,
        'X-RateLimit-Remaining': item2.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + item2.msBeforeNext)
      };
      ctx.set(headers);
      return await next();
    } catch (error) {
      if (error && error.remainingPoints !== undefined) {
        const headers = {
          'Retry-After': error.msBeforeNext / 1000,
          'X-RateLimit-Limit': opts.max,
          'X-RateLimit-Remaining': error.remainingPoints,
          'X-RateLimit-Reset': new Date(timestamp + error.msBeforeNext)
        };
        ctx.set(headers);
        ctx.status = 429;
        ctx.body = await opts.errorMessage() || 'Rate limit exceeded.';
      } else {
        throw error;
      }
    }
  };
}

/**
 * Expose `ratelimit()`.
 */

module.exports = ratelimit;
