const path = require('path');

const config = {
  entry: {
    app: './src/app.js',
    models: './src/models/index.js'
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name].js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.node$/,
        use: 'node-loader',
      },
    ],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  target: 'node',
};

module.exports = config;
