# moment-timezone-data-webpack-plugin

[![npm](https://img.shields.io/npm/v/moment-timezone-data-webpack-plugin.svg)](https://www.npmjs.com/package/moment-timezone-data-webpack-plugin)
[![Build Status](https://travis-ci.org/gilmoreorless/moment-timezone-data-webpack-plugin.svg?branch=master)](https://travis-ci.org/gilmoreorless/moment-timezone-data-webpack-plugin)
[![Greenkeeper badge](https://badges.greenkeeper.io/gilmoreorless/moment-timezone-data-webpack-plugin.svg)](https://greenkeeper.io/)

Oof, that’s a clunky name, but at least it’s descriptive.

This is a **plugin** for **webpack** which reduces **data** for **moment-timezone**.

- [Why is this needed?](#why-is-this-needed)
    - [Example](#example)
    - [⚠️ Make sure you know what you’re doing ❗️️](#️-make-sure-you-know-what-youre-doing-️️)
- [Usage](#usage)
    - [Installation](#installation)
    - [Configuration](#configuration)
        - [Plugin options](#plugin-options)
    - [Version support](#version-support)
- [Examples](#examples)
    - [All zones, with a limited date range](#all-zones-with-a-limited-date-range)
    - [All data for a specific zone](#all-data-for-a-specific-zone)
    - [Limited data for a set of zones (single regular expression)](#limited-data-for-a-set-of-zones-single-regular-expression)
    - [Limited data for a set of zones (array of values)](#limited-data-for-a-set-of-zones-array-of-values)
- [License](#license)

## Why is this needed?

[Moment Timezone][moment-tz] is a comprehensive library for working with time zones in JavaScript.
But that comprehensiveness comes with a file size cost. The full time zone data file is 903KiB raw, or 36KiB minified and gzipped (as of `moment-timezone` version `0.5.23`).

That’s a lot of data to send to someone’s browser, especially if you don’t need all of it. Some of the time zones have data dating back to the 19th century. Thankfully [there is an API][moment-tz-filter] to produce a custom data bundle containing only the time zone definitions you require.

Unfortunately, if you’re building your project with [webpack][webpack], you don’t get to use a custom data bundle. A webpack build uses the Node.js version of `moment-timezone`, which automatically includes _all_ the time zone data.
Even if you configure Moment Timezone to use a custom data bundle at run-time, the full data file will still be present in your JavaScript bundle.

This plugin allows you to configure which time zone data you want. Any unwanted data is then automatically stripped from the compiled JS bundle at build time.

Use it in combination with the [`moment-locales-webpack-plugin`][moment-webpack] to further reduce the compiled JS bundle size.

### Example

Take a [super-simple file](example/src/index.js) which does nothing more than `require('moment-timezone')`. Building this with webpack in production mode results in over 1 MiB of minified JS code.

What if you only need the default English locale, and time zone data for Australia and New Zealand from 2018 to 2028? (This is a realistic scenario from a recent project.)

Running webpack in production mode results in the following file sizes:

| [Configuration](example/config) | Raw size | Gzipped |
|---|---|---|
| Default                 | 1164 KiB        | 105 KiB |
| Strip locales           |  959 KiB (~82%) |  56 KiB (~53%) |
| Strip tz data           |  265 KiB (~23%) |  69 KiB (~66%) |
| Strip locales & tz data |   60 KiB (~5%)  |  20 KiB (~19%) |

(Testing done with `webpack@4.28.3`, `moment@2.23.0`, `moment-timezone@0.5.23`.)

Even if you still need all the time zones available, reducing the data to a much smaller date range can produce significant file size savings. Building the above example file with data for all zones from 2018 to 2028 produces a file size of 288KiB, or 74KiB gzipped.

### ⚠️ Make sure you know what you’re doing ❗️️

Dealing with time zones can be tricky, and bugs can pop up in unexpected places. That’s doubly true when you’re auto-removing data at build time. When using this plugin, make **absolutely sure** that you won’t need the data you’re removing.

For example, if you know **_for certain_** that your web site/application...

1. ...will never deal with past dates & times earlier than a certain point (e.g. the launch date of the application).
    * It’s safe to remove any data before that date (using the [`startYear` option][options]).
2. ...will never deal with future dates & times beyond a certain point (e.g. details of a specific event).
    * It’s (relatively) safe to remove any data beyond that date (using the [`endYear` option][options]).
3. ...will only deal with a fixed set of time zones (e.g. rendering times relative to a set of physical buildings in a single country).
    * It’s safe to keep only the data required for those zones (using the [`matchZones` option][options]).

However, if you’re allowing users to choose their time zone preference — with no theoretical limit on the range of dates you’ll handle — then you’re going to need all the data you can get.

If you’re in doubt about whether to include some data, err on the side of caution and include it.

## Usage

### Installation

Using [npm][npm]:

```sh
npm install --save-dev moment-timezone-data-webpack-plugin
```

Or using [yarn][yarn]:

```sh
yarn add --dev moment-timezone-data-webpack-plugin
```

### Configuration

Add the plugin to your webpack config file:

```js
const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin');

module.exports = {
  plugins: [
    new MomentTimezoneDataPlugin({
      // options
    }),
  ]
};
```

#### Plugin options

There are three available options to filter the time zone data. **At least one option** must be provided.

* `startYear` _(integer)_ — Only include data from this year onwards.
* `endYear` _(integer)_ — Only include data up to (and including) this year.
* `matchZones` — Only include data for time zones with names matching this value. `matchZones` can be any of these types:
  * _string_ — Include only this zone name as an exact match (e.g. `'Australia/Sydney'`).
  * _regexp_ — Include zones with names matching the regular expression (e.g. `/^Australia\//`).
  * _array_ (of the above types) — Include zones matching any of the values of the array. Each value can be a string or a regular expression, which will be matched following the rules above.

### Version support

This plugin has been tested with and officially supports the following dependencies:

* Node.js 8 or higher
* webpack 4

It theoretically supports older versions of webpack (as it uses built-in webpack plugins internally), but this hasn’t been tested.


## Examples

### All zones, with a limited date range

```js
const currentYear = new Date().getFullYear();
const plugin = new MomentTimezoneDataPlugin({
  startYear: currentYear - 2,
  endYear: currentYear + 10,
});
```

### All data for a specific zone

```js
const plugin = new MomentTimezoneDataPlugin({
  matchZones: 'America/New_York',
});
```

### Limited data for a set of zones (single regular expression)

```js
const plugin = new MomentTimezoneDataPlugin({
  matchZones: /Europe\/(Belfast|London|Paris|Athens)/,
  startYear: 2000,
  endYear: 2030,
});
```

### Limited data for a set of zones (array of values)

```js
const plugin = new MomentTimezoneDataPlugin({
  matchZones: [/^Australia/, 'Pacific/Auckland', 'Etc/UTC'],
  startYear: 2000,
  endYear: 2030,
});
```

## License

[MIT License © Gilmore Davidson](LICENSE)


[moment-tz]: https://momentjs.com/timezone/
[moment-tz-filter]: http://momentjs.com/timezone/docs/#/data-utilities/filter-link-pack/
[moment-webpack]: https://github.com/iamakulov/moment-locales-webpack-plugin
[npm]: https://www.npmjs.com/
[options]: #plugin-options
[webpack]: https://webpack.js.org/
[yarn]: https://yarnpkg.com/
