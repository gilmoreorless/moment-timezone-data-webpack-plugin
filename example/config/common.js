const path = require('path');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const MomentTimezoneDataPlugin = require('../../src');

module.exports = (fileName, extraConfig = {}) => {
  let config = {
    mode: 'production',
    devtool: 'source-map',
    entry: path.resolve(__dirname, '../src/index.js'),
    output: {
      filename: `${fileName}.js`,
      path: path.resolve(__dirname, '../dist'),
    },
    plugins: [],
  };
  if (extraConfig.stripLocales) {
    config.plugins.push(new MomentLocalesPlugin());
  }
  if (extraConfig.stripZones) {
    config.plugins.push(new MomentTimezoneDataPlugin({
      matchZones: /Australia|Pacific\/Auckland|UTC/,
      startYear: 2018,
      endYear: 2028,
    }));
  }
  return config;
};
