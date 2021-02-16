const path = require('path');
const webpack = require('webpack');
const { createFsFromVolume, Volume } = require('memfs');
const moment = require('moment-timezone');
const MomentLocalesPlugin = require('moment-locales-webpack-plugin');
const MomentTimezoneDataPlugin = require('../src');

const rGeneratedFile = /[\\/]node_modules[\\/]\.cache[\\/]moment-timezone-data-webpack-plugin[\\/].+?\.json$/;

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
  compiler.outputFileSystem = createFsFromVolume(new Volume());
  // Add a non-standard `fs.join` that's used by webpack v4
  compiler.outputFileSystem.join = path.join;

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      }

      const module = Array.from(stats.compilation.modules).find(mod =>
          rGeneratedFile.test(mod.request) // Matches only if data processed (and cache generated)
      );
      const data = module ? module.buildInfo.jsonData : null; // In case no processing happened

      resolve({ stats, module, data });
    });
  });
}
buildWebpack.version = webpack.version;

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
