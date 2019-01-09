const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const common = require('./common');

module.exports = common('locales', {
  plugins: [
    new MomentLocalesPlugin(),
  ],
});
