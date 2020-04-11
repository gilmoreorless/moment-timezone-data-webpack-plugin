const path = require('path');
const webpack = require('webpack');
const MemoryFS = require('memory-fs');
const moment = require('moment-timezone');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const MomentTimezoneDataPlugin = require('../src');

// buildWebpack method inspired by MomentLocalesPlugin and @webpack-contrib/test-utils
function buildWebpack(options) {
  const compiler = webpack({
    mode: 'development',
    devtool: 'hidden-source-map',
    entry: path.resolve(__dirname, 'fixtures', 'index.js'),
    output: {
      path: __dirname,
      filename: 'test-output.[filehash].js',
    },
    plugins: [
      new MomentTimezoneDataPlugin(options),
      new MomentLocalesPlugin(), // Required for making tests faster
    ],
  });
  compiler.outputFileSystem = new MemoryFS();

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }

      const module = stats.compilation.modules.find(module =>
        module.reasons[0].dependency.request === './data/packed/latest.json'
      );
      const source = module.originalSource();
      let data = null;
      try {
        data = JSON.parse(source.source());
      } catch (e) {
        reject(e);
      }

      resolve({ stats, module, data });
    });
  });
}

function getPackedNames(packedList, index = 0) {
  return packedList
    .map(packedZone => packedZone.split('|')[index])
    .sort();
}

function zoneNames(packedData) {
  return getPackedNames(packedData.zones, 0);
}

function linkNames(packedData) {
  return getPackedNames(packedData.links, 1);
}

function countryCodes(packedData) {
  return getPackedNames(packedData.countries, 0);
}

function transitionRange(packedZone) {
  const { name, untils } = moment.tz.unpack(packedZone);
  if (!untils.length) {
    return { start: null, end: null };
  }
  const first = untils[0];
  let last = Infinity;
  let i = untils.length - 1;
  while (i && last === Infinity) {
    last = untils[i--];
  }
  return {
    start: moment.tz(first || null, name),
    end:   moment.tz(last  || null, name),
  };
}

module.exports = {
  buildWebpack,
  zoneNames,
  linkNames,
  countryCodes,
  transitionRange,
};
