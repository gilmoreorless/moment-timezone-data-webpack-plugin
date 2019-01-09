const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const MomentTimezonesPlugin = require('../../src');
const common = require('./common');

module.exports = common('timezones', {
  plugins: [
    new MomentTimezonesPlugin({
      matchZones: /Australia|Pacific\/Auckland|UTC/,
      startYear: 2018,
      endYear: 2028,
    }),
    new MomentLocalesPlugin(),
  ],
});
