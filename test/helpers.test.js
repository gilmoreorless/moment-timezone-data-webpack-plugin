const assert = require('power-assert');
const del = require('del');
const fs = require('fs');
const findCacheDir = require('find-cache-dir');
const { unique, createMatchers, anyMatch, cacheDir } = require('../src/helpers');

describe('unique', () => {
  it('returns empty array when a non-array is provided', () => {
    assert.deepEqual(unique(), []);
    assert.deepEqual(unique(null), []);
    assert.deepEqual(unique({ a: 1, b: 2 }), []);
  });

  it('returns unique values for an array', () => {
    assert.deepEqual(
      unique([1, '1', 0, false, 1, 4, 0, 5]),
      [1, '1', 0, false, 4, 5]
    );
  });

  it('returns unique values for a string', () => {
    assert.deepEqual(
      unique('This is a string'),
      ['T', 'h', 'i', 's', ' ', 'a', 't', 'r', 'n', 'g']
    );
  });
});

describe('createMatchers', () => {
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
      matchers.some(m => m.test(s))
    );
    assert.deepEqual(matched, expectedMatches);
  }

  it('when arg is empty, returns a "match everything" regexp', () => {
    let matchers = createMatchers();
    assertMatchers(matchers, 1, testStrings);
  });

  it('when arg is a regexp, returns array of original regexp', () => {
    let regexp = /s/i;
    let matchers = createMatchers(regexp);
    assertMatchers(matchers, 1, ['CaSe sensitivE']);
    assert(matchers[0] === regexp);
  });

  it('when arg is a string, returns array of regexp exactly matching that string', () => {
    let matchers = createMatchers('exact text');
    assertMatchers(matchers, 1, ['exact text']);
  });

  it('when arg is array of all strings, returns array of regexp exactly matching strings', () => {
    let matchers = createMatchers(['1984', 'exact text', 'case sensitive']);
    assertMatchers(matchers, 1, ['exact text', '1984']);
  });

  it('when arg is array of regexps, returns array of original regexps', () => {
    let regexp = /s/i;
    let matchers = createMatchers([regexp, /exact text/]);
    assertMatchers(matchers, 2, ['exact text', 'inexact text example', 'CaSe sensitivE']);
    assert(matchers[0] === regexp);
  });

  it('when arg is array of mixed values, returns array of regexps', () => {
    let matchers = createMatchers(['EXACT TEXT', /e\s/, 'exact text']);
    assertMatchers(matchers, 2, ['EXACT TEXT', 'exact text', 'CaSe sensitivE']);
  });

  it('when arg is not a string, returns array of regexp matching toString() value', () => {
    let matchers = createMatchers(1984);
    assertMatchers(matchers, 1, ['1984']);
  });
});

describe('anyMatch', () => {
  const item = 'ABC';
  const argList = [
    // [name, matchers, result]
    ['missing', undefined, true],
    ['empty', [], true],
    ['single RegExp', [/^A/], true],
    ['many RegExps', [/^Z/, /\d/, /c$/i], true],
    ['non-matching RegExps', [/^Z/, /\d/, /[D-H]/], false],
  ];

  for (let [name1, arg1, result1] of argList) {
    for (let [name2, arg2, result2] of argList) {
      let expected = result1 && result2;
      it(`returns ${expected} with 1st matcher = ${name1}, 2nd matchers = ${name2}`, () => {
        assert(anyMatch(item, arg1, arg2) === expected);
      });
    }
  }
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
