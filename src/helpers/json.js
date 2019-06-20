module.exports = function(ctx, next) {
  const handleJson = function(data) {
    ctx.type = 'application/json;charset=utf-8';
    ctx.body = JSON.stringify(data);
  };

  ctx.json = handleJson;
  return next();
};
