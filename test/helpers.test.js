const assert = require('power-assert');
const del = require('del');
const fs = require('fs');
const findCacheDir = require('find-cache-dir');
const { createZoneMatchers, cacheDir } = require('../src/helpers');

describe('createZoneMatchers', () => {
  const testStrings = [
    'EXACT TEXT',
    'exact text',
    'inexact text example',
    'CaSe sensitivE',
    '1984',
  ];

  function assertMatchers(matchers, expectedLength, expectedMatches) {
    assert(Array.isArray(matchers));
    assert(matchers.length === expectedLength);
    assert(matchers.every(m => m instanceof RegExp));
    let matched = testStrings.filter(s =>
      matchers.find(m => m.test(s))
    );
    assert.deepEqual(matched, expectedMatches);
  }

  it('when arg is a regexp, returns array of original regexp', () => {
    let regexp = /s/i;
    let matchers = createZoneMatchers(regexp);
    assertMatchers(matchers, 1, ['CaSe sensitivE']);
    assert(matchers[0] === regexp);
  });

  it('when arg is a string, returns array of regexp exactly matching that string', () => {
    let matchers = createZoneMatchers('exact text');
    assertMatchers(matchers, 1, ['exact text']);
  });

  it('when arg is array of all strings, returns array of regexp exactly matching strings', () => {
    let matchers = createZoneMatchers(['1984', 'exact text', 'case sensitive']);
    assertMatchers(matchers, 1, ['exact text', '1984']);
  });

  it('when arg is array of regexps, returns array of original regexps', () => {
    let regexp = /s/i;
    let matchers = createZoneMatchers([regexp, /exact text/]);
    assertMatchers(matchers, 2, ['exact text', 'inexact text example', 'CaSe sensitivE']);
    assert(matchers[0] === regexp);
  });

  it('when arg is array of mixed values, returns array of regexps', () => {
    let matchers = createZoneMatchers(['EXACT TEXT', /e\s/, 'exact text']);
    assertMatchers(matchers, 2, ['EXACT TEXT', 'exact text', 'CaSe sensitivE']);
  });

  it('when arg is not a string, returns array of regexp matching toString() value', () => {
    let matchers = createZoneMatchers(1984);
    assertMatchers(matchers, 1, ['1984']);
  });
});

describe('cacheDir', () => {
  const defaultDir = findCacheDir({ name: 'moment-timezone-data-webpack-plugin' });
  const customDir = findCacheDir({ name: 'custom-name' });

  beforeEach(() => {
    del.sync(defaultDir);
    del.sync(customDir);
  });

  it('creates a new directory in an auto-generated location', () => {
    cacheDir();
    assert(fs.existsSync(defaultDir));
  });

  it('creates a new directory in a provided location', () => {
    cacheDir(customDir);
    assert(fs.existsSync(customDir));
  });

  afterEach(() => {
    del.sync(defaultDir);
    del.sync(customDir);
  });
});
