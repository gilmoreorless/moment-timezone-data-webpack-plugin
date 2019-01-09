const path = require('path');

module.exports = (fileName, extraConfig = {}) => ({
  mode: 'production',
  devtool: 'source-map',
  entry: path.resolve(__dirname, '../src/index.js'),
  output: {
    filename: `${fileName}.js`,
    path: path.resolve(__dirname, '../dist'),
  },
  ...extraConfig,
});
