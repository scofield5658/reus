require('babel-register')({
  ignore: false
});
require('babel-polyfill');
require(process.env.ENTRY || '../src/app.js');
