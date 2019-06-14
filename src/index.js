const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const { createZoneMatchers, cacheFile } = require('./helpers');

function filterData(tzdata, config, file) {
  const moment = require('moment-timezone/moment-timezone-utils');
  const { matchZones, startYear, endYear } = config;
  let matchers = createZoneMatchers(matchZones);
  const newLinksData = tzdata.links
    .map(link => link.split('|'))
    .filter(link =>
      matchers.find(matcher => matcher.test(link[1]))
    );

  // If links exist, add the source zones to the matcher list
  if (newLinksData.length) {
    let linkMatchers = createZoneMatchers(
      newLinksData.map(link => link[0])
    );
    matchers = matchers.concat(linkMatchers);
  }

  const newZonesData = tzdata.zones
    .filter(zone =>
      matchers.find(matcher => matcher.test(zone.split('|')[0]))
    )
    .map(moment.tz.unpack);
  const filteredData = moment.tz.filterLinkPack(
    {
      version: tzdata.version,
      zones: newLinksData.reduce((zones, link) => {
        const newEntry = { ...newZonesData.find(z => z.name === link[0]) };
        newEntry.name = link[1];
        zones.push(newEntry);
        return zones;
      }, newZonesData ),
      links: [],
    },
    startYear,
    endYear
  );
  fs.writeFileSync(file.path, JSON.stringify(filteredData, null, 2));
}

function throwInvalid(message) {
  throw new Error(`MomentTimezoneDataPlugin: ${message}`);
}

function validateOptions(options) {
  const knownOptions = ['matchZones', 'startYear', 'endYear', 'cacheDir'];
  const optionNames = Object.keys(options);
  let usedOptions = [];
  let unknownOptions = [];
  optionNames.forEach(name => {
    (knownOptions.includes(name) ? usedOptions : unknownOptions).push(name);
  });

  // Unknown options
  if (unknownOptions.length) {
    throwInvalid(
      `Unknown options provided (${unknownOptions.join(', ')}). ` +
      `Supported options are: ${knownOptions.join(', ')}.`
    );
  }

  // At least one option required
  if (!usedOptions.length) {
    throwInvalid('Must provide at least one filtering option.');
  }

  // Invalid years
  ['startYear', 'endYear'].forEach(option => {
    if (option in options && !Number.isInteger(options[option])) {
      throwInvalid(`Invalid option — ${option} must be an integer.`);
    }
  });

  // Invalid cache dir (not an absolute path)
  if ('cacheDir' in options && !path.isAbsolute(options.cacheDir)) {
    throwInvalid(`Provided cacheDir is not absolute: '${cacheDir}'`);
  }
}

function MomentTimezoneDataPlugin(options = {}) {
  validateOptions(options);

  const startYear = options.startYear || -Infinity;
  const endYear = options.endYear || Infinity;
  const matchZones = options.matchZones || /./;
  const cacheDir = options.cacheDir || null;

  return new webpack.NormalModuleReplacementPlugin(
    /data[\\/]packed[\\/]latest\.json$/,
    resource => {
      if (resource.context.match(/node_modules[\\/]moment-timezone$/)) {
        const config = { matchZones, startYear, endYear };
        const tzdata = require('moment-timezone/data/packed/latest.json');
        const file = cacheFile(tzdata, config, cacheDir);
        if (!file.exists) {
          try {
            filterData(tzdata, config, file);
          } catch (err) {
            console.warn(err); // eslint-disable-line no-console
            return; // Don't rewrite the request
          }
        }
        resource.request = file.path;
      }
    }
  );
}

module.exports = MomentTimezoneDataPlugin;
