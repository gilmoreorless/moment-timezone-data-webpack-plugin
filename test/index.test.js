const assert = require('assert');
const del = require('del');
const findCacheDir = require('find-cache-dir');
const glob = require('glob');
const moment = require('moment-timezone');
const MomentTimezoneDataPlugin = require('../src');
const { buildWebpack, zoneNames, linkNames, countryCodes, transitionRange } = require('./utils');

const momentHasCountries = typeof moment.tz.countries === 'function';
const versions = [
  `webpack@${buildWebpack.version}`,
  `moment-timezone@${moment.tz.version} (${momentHasCountries ? 'has countries' : "doesn't have countries"})`,
];
console.log(`\n--- Running tests with ${versions.join(', ')} ---`);

describe('instantiation', () => {
  const cacheDir = findCacheDir({ name: 'moment-timezone-data-webpack-plugin' });

  it('accepts valid options', () => {
    const options = {
      matchZones: /Europe/,
      startYear: 2000,
      endYear: 2038,
      cacheDir: cacheDir,
    };
    if (momentHasCountries) {
      options.matchCountries = /ES|FR/;
    }
    assert.doesNotThrow(
      () => new MomentTimezoneDataPlugin(options)
    );
  });

  // TOOD: Warn instead of throw?
  it('throws when called with no arguments', () => {
    assert.throws(
      () => new MomentTimezoneDataPlugin(),
      /Must provide at least one filtering option./
    );
  });

  it('throws when called with empty options', () => {
    assert.throws(
      () => new MomentTimezoneDataPlugin({}),
      /Must provide at least one filtering option./
    );
  });

  it('throws when called with unknown options', () => {
    assert.throws(
      () => new MomentTimezoneDataPlugin({
        matchZones: /Europe/,
        localesToKeep: ['en', 'fr', 'de'],
      }),
      /Unknown.*?localesToKeep/
    );
  });

  it('throws when called with just non-filtering options', () => {
    assert.throws(
      () => new MomentTimezoneDataPlugin({
        cacheDir: cacheDir,
      }),
      /Must provide at least one filtering option./
    );
  });

  it('throws when called with invalid year options', () => {
    assert.throws(
      () => new MomentTimezoneDataPlugin({
        startYear: 'string'
      }),
      /Invalid option — startYear must be an integer./
    );
  });

  it('throws when called with invalid cacheDir path', () => {
    assert.throws(
      () => new MomentTimezoneDataPlugin({
        matchZones: /Europe/,
        cacheDir: 1,
      }),
      /Provided cacheDir is an invalid path: '1'/
    );
  });
});

describe('usage', () => {
  const cacheDir = findCacheDir({ name: 'moment-timezone-data-webpack-plugin' });

  beforeEach(() => {
    del.sync(cacheDir);
  });

  describe('matchZones option', () => {
    it('filters zones matching a single string (exact match)', async () => {
      const { data } = await buildWebpack({
        matchZones: 'Antarctica/Troll',
      });
      assert.deepEqual(zoneNames(data), ['Antarctica/Troll']);
      assert.ok(linkNames(data).length === 0);
    });

    it("returns no zones when a single string argument doesn't match anything", async () => {
      const { data } = await buildWebpack({
        matchZones: 'Troll',
      });
      assert.ok(zoneNames(data).length === 0);
      assert.ok(linkNames(data).length === 0);
    });

    it('filters zones matching a single regexp', async () => {
      const { data } = await buildWebpack({
        matchZones: /uu/,
      });
      assert.deepEqual(zoneNames(data), ['Pacific/Chuuk']);
      assert.ok(linkNames(data).length === 0);
    });

    it('filters zones matching an array of strings (exact match)', async () => {
      const { data } = await buildWebpack({
        // 'London' won't match anything; the zone name is 'Europe/London'
        matchZones: ['Europe/Madrid', 'Europe/Berlin', 'London'],
      });
      assert.deepEqual(zoneNames(data), ['Europe/Berlin', 'Europe/Madrid']);
      assert.ok(linkNames(data).length === 0);
    });

    it('filters zones matching an array of regexps', async () => {
      const { data } = await buildWebpack({
        matchZones: [/Argentina\/S/, /europe\/z.*?h.*?$/i],
      });
      assert.deepEqual(zoneNames(data), [
        'America/Argentina/Salta', 'America/Argentina/San_Juan', 'America/Argentina/San_Luis',
        'Europe/Zaporozhye', 'Europe/Zurich'
      ]);
      assert.ok(linkNames(data).length === 0);
    });

    it('filters zones matching an array of mixed values', async () => {
      const { data } = await buildWebpack({
        matchZones: ['Australia/Sydney', /Argentina\/S/, 'Africa/Nairobi'],
      });
      assert.deepEqual(zoneNames(data), [
        'Africa/Nairobi', 'America/Argentina/Salta', 'America/Argentina/San_Juan',
        'America/Argentina/San_Luis', 'Australia/Sydney'
      ]);
      assert.ok(linkNames(data).length === 0);
    });

    it('includes non-matching zones that are sources for matching links', async () => {
      const { data } = await buildWebpack({
        matchZones: /z$/,
      });
      // 'Europe/Zurich' doesn't match, but it's the source for the 'Europe/Vaduz' link
      assert.deepEqual(zoneNames(data), ['America/La_Paz', 'Europe/Zurich']);
      assert.deepEqual(linkNames(data), ['Europe/Vaduz']);
    });

    if (momentHasCountries) {
      it('filters country data based on matching zones', async () => {
        const { data } = await buildWebpack({
          matchZones: /z$/,
        });
        assert.deepEqual(data.countries, [
          'BO|America/La_Paz',
          'CH|Europe/Zurich',
          'DE|Europe/Zurich',
          'LI|Europe/Zurich Europe/Vaduz',
        ]);
      });
    }
  });

  describe('matchCountries option', () => {
    if (momentHasCountries) {
      it('filters zones for a country matching a single string (exact match)', async () => {
        const { data } = await buildWebpack({
          matchCountries: 'BA',
        });
        assert.deepEqual(countryCodes(data), ['BA']);
        assert.deepEqual(zoneNames(data), ['Europe/Belgrade']);
        assert.deepEqual(linkNames(data), ['Europe/Sarajevo']);
      });

      it("returns no zones when a single string argument doesn't match any country", async () => {
        const { data } = await buildWebpack({
          matchCountries: 'ZX',
        });
        assert.ok(countryCodes(data).length === 0);
        assert.ok(zoneNames(data).length === 0);
        assert.ok(linkNames(data).length === 0);
      });

      it('filters zones for a country matching a single regexp', async () => {
        const { data } = await buildWebpack({
          matchCountries: /^Z/,
        });
        assert.deepEqual(countryCodes(data), ['ZA', 'ZM', 'ZW']);
        assert.deepEqual(zoneNames(data), ['Africa/Johannesburg', 'Africa/Maputo']);
        assert.deepEqual(linkNames(data), ['Africa/Harare', 'Africa/Lusaka']);
      });

      it('filters zones for countries matching an array of strings (exact match)', async () => {
        const { data } = await buildWebpack({
          // 'A' should not do any partial matching of codes
          matchCountries: ['MO', 'CH', 'A'],
        });
        assert.deepEqual(countryCodes(data), ['CH', 'MO']);
        assert.deepEqual(zoneNames(data), ['Asia/Macau', 'Europe/Zurich']);
        assert.ok(linkNames(data).length === 0);
      });

      it('filters zones for countries matching an array of regexps', async () => {
        const { data } = await buildWebpack({
          matchCountries: [/^q/i, /D[AEIOU]/],
        });
        assert.deepEqual(countryCodes(data), ['DE', 'DO', 'QA']);
        assert.deepEqual(zoneNames(data), [
          'America/Santo_Domingo', 'Asia/Qatar',
          'Europe/Berlin', 'Europe/Zurich',
        ]);
        assert.deepEqual(linkNames(data), ['Europe/Busingen']);
      });

      it('filters zones for countries matching an array of mixed values', async () => {
        const { data } = await buildWebpack({
          matchCountries: [/B$/, 'AZ'],
        });
        assert.deepEqual(countryCodes(data), ['AZ', 'BB', 'GB', 'LB', 'SB']);
        assert.deepEqual(zoneNames(data), [
          'America/Barbados', 'Asia/Baku', 'Asia/Beirut',
          'Europe/London', 'Pacific/Guadalcanal',
        ]);
        assert.ok(linkNames(data).length === 0);
      });

      it('returns only zones matching matchCountries AND matchZones', async () => {
        const { data } = await buildWebpack({
          matchCountries: 'AU',
          matchZones: /\/\w{5}$/, // 5-letter city name
        });
        assert.deepEqual(countryCodes(data), ['AU']);
        assert.deepEqual(zoneNames(data), ['Australia/Eucla', 'Australia/Perth']);
        assert.ok(linkNames(data).length === 0);
      });

      // https://github.com/moment/moment-timezone/issues/835
      it('includes data from links referenced by a country code', async () => {
        const { data } = await buildWebpack({
          matchCountries: 'UM'
        });
        assert.deepEqual(zoneNames(data), ['Pacific/Honolulu', 'Pacific/Pago_Pago', 'Pacific/Tarawa']);
        assert.deepEqual(linkNames(data), ['Pacific/Midway', 'Pacific/Wake']);
      });
    }

    if (!momentHasCountries && assert.rejects !== undefined) {
      it('throws when using matchCountries and moment-timezone has no country data', async () => {
        await assert.rejects(
          async () => {
            await buildWebpack({
              matchCountries: 'AU',
            });
          },
          /The matchCountries option can only work with moment-timezone 0.5.28 or later./
        );
      });
    }
  });

  describe('date options', () => {
    it('filters data based on start year', async () => {
      const { data } = await buildWebpack({
        startYear: 2030,
      });
      assert(data.zones.length > 0);
      const testZone = data.zones.find(zone => zone.startsWith('Australia/Sydney'));
      const { start, end } = transitionRange(testZone);
      assert(start.year() === 2030);
      // This should be the real test once https://github.com/moment/moment-timezone/issues/768 is fixed
      // assert(end.year() >= 2100);
      assert(end.year() >= 2037);
    });

    it('filters data based on end year', async () => {
      const { data } = await buildWebpack({
        endYear: 1980,
      });
      const testZone = data.zones.find(zone => zone.startsWith('Australia/Sydney'));
      const { start, end } = transitionRange(testZone);
      // This should be the real test once https://github.com/moment/moment-timezone/issues/768 is fixed
      // assert(start.year() <= 1900);
      assert(start.year() <= 1920);
      assert(end.year() === 1980);
    });

    it('filters data based on start and end years', async () => {
      const { data } = await buildWebpack({
        startYear: 1999,
        endYear: 2001,
      });
      const testZone = data.zones.find(zone => zone.startsWith('Australia/Sydney'));
      const { start, end } = transitionRange(testZone);
      assert(start.year() === 1999);
      assert(end.year() === 2001);
    });

    it('filters data based on single year when start and end are the same', async () => {
      const { data } = await buildWebpack({
        startYear: 1984,
        endYear: 1984,
      });
      const testZone = data.zones.find(zone => zone.startsWith('Australia/Sydney'));
      const { start, end } = transitionRange(testZone);
      assert(start.year() === 1984);
      assert(end.year() === 1984);
    });

    it('swaps year values when start year is after end year', async () => {
      const { data } = await buildWebpack({
        startYear: 2020,
        endYear: 1990,
      });
      const testZone = data.zones.find(zone => zone.startsWith('Australia/Sydney'));
      const { start, end } = transitionRange(testZone);
      assert(start.year() === 1990);
      assert(end.year() === 2020);
    });

    it('filters data based on all options', async () => {
      const { data } = await buildWebpack({
        matchZones: /Australia\/(Sydney|Hobart)/,
        startYear: 2007,
        endYear: 2010,
      });
      const { start, end } = transitionRange(data.zones[0]);
      assert(start.year() === 2007);
      assert(end.year() === 2010);
      assert.deepEqual(zoneNames(data), ['Australia/Hobart', 'Australia/Sydney']);
      assert(data.links.length === 0);
    });

    it('updates links based on year options', async () => {
      // Hobart and Sydney have used the same transition rules since 2008
      const { data } = await buildWebpack({
        matchZones: /Australia\/(Sydney|Hobart)/,
        startYear: 2008,
        endYear: 2010,
      });
      assert.deepEqual(zoneNames(data), ['Australia/Sydney']);
      assert.deepEqual(linkNames(data), ['Australia/Hobart']);
    });

    it("includes all zones and links when matchZones isn't provided", async () => {
      const { data } = await buildWebpack({
        startYear: 1700,
        endYear: 2300,
      });
      const zoneCount = data.zones.length + data.links.length;
      assert(zoneCount === moment.tz.names().length);
      if (momentHasCountries) {
        assert(data.countries.length === moment.tz.countries().length);
      }
    });

    it("does not include links from undefined timezones", async () => {
      const { data } = await buildWebpack({
        startYear: 2000
      });
      for (const link of data.links) {
        const from = link.split('|')[0];
        const matchingZone = data.zones.find(zone => zone.startsWith(from));
        assert.notEqual(matchingZone, undefined, `'${from}' not in zones`);
      }
    });
  });

  describe('caching', () => {
    const cachedFiles = () => glob.sync(`${cacheDir}/*.json`);

    it('reuses cached data for consecutive calls with the same options', async () => {
      assert(cachedFiles().length === 0);

      const options = { matchZones: /Etc/ };
      await buildWebpack(options);
      assert(cachedFiles().length === 1);

      await buildWebpack(options);
      assert(cachedFiles().length === 1);
    });

    it("doesn't reuse cached data when options change", async () => {
      assert(cachedFiles().length === 0);

      await buildWebpack({ matchZones: /Etc/ });
      assert(cachedFiles().length === 1);

      await buildWebpack({ matchZones: 'Etc' });
      assert(cachedFiles().length === 2);
    });
  });
});
