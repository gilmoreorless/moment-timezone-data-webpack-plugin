const crypto = require('crypto');
const findCacheDir = require('find-cache-dir');
const fs = require('fs');
const mkdir = require('make-dir');
const os = require('os');
const path = require('path');
const webpack = require('webpack');

const pluginName = 'moment-timezone-data-webpack-plugin';

function cacheKey(tzdata, config) {
  return JSON.stringify({
    version: tzdata.version,
    zones: config.matchZones.toString(),
    dates: [config.startYear, config.endYear],
  });
}

const cacheDir = (function () {
  let cacheDirPath;

  return function () {
    if (!cacheDirPath) {
      try {
        cacheDirPath = findCacheDir({ name: pluginName, create: true });
      } catch (e) {
        cacheDirPath = path.join(os.tmpdir(), pluginName);
        mkdir.sync(cacheDirPath);
      }
    }
    return cacheDirPath;
  }
})();

function cacheFile(tzdata, config) {
  const key = cacheKey(tzdata, config);
  const filename = crypto.createHash('md4')
    .update(key)
    .digest('hex') + '.json';
  const filepath = path.join(cacheDir(), filename);
  return {
    path: filepath,
    exists: fs.existsSync(filepath),
  };
}

function filterData(tzdata, config, file) {
  const moment = require('moment-timezone/moment-timezone-utils');
  const { matchZones, startYear, endYear } = config;
  const newZonesData = tzdata.zones
    .filter(zone => matchZones.test(zone))
    .map(moment.tz.unpack);
  const filteredData = moment.tz.filterLinkPack(
    {
      version: tzdata.version,
      zones: newZonesData,
      links: [],
    },
    startYear,
    endYear
  );
  fs.writeFileSync(file.path, JSON.stringify(filteredData, null, 2));
}

function MomentTimezoneDataPlugin(options = {}) {
  // TODO: Actually check options
  const matchZones = /Australia/;
  const startYear = 2018;
  const endYear = 2028;

  return new webpack.NormalModuleReplacementPlugin(
    /data\/packed\/latest\.json$/,
    resource => {
      if (resource.context.match(/node_modules\/moment-timezone$/)) {
        const config = { matchZones, startYear, endYear };
        const tzdata = require('moment-timezone/data/packed/latest.json');
        const file = cacheFile(tzdata, config);
        if (!file.exists) {
          filterData(tzdata, config, file);
        }
        resource.request = file.path;
      }
    }
  );
}

module.exports = MomentTimezoneDataPlugin;
