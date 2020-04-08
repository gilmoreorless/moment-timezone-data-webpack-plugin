# Change Log
All notable public changes to this project will be documented in this file (the format is based on [Keep a Changelog](http://keepachangelog.com/)).
Development-only changes (e.g. updates to `devDependencies`) will not be listed here, as they don’t affect the public API.
This project adheres to [Semantic Versioning](http://semver.org/).

## _Unreleased_
### Added
- Support `countries` data for `moment-timezone` versions `0.5.28` and later (#22).
    - Filter `countries` list based on matching zones.
    - New `matchCountries` filtering option to select all zones for a given set of countries.

## 1.1.0 – 2019-06-17
### Added
- New `cacheDir` option (PR #11 — thanks to @sgomes).

### Changed
- Updated `make-dir` dependency to `3.0.0`.
- Updated `find-cache-dir` dependency to `3.0.0`.

## 1.0.3 – 2019-02-24
### Fixed
- Ensure there are no links from unknown timezones (PR #6 — thanks to @sgomes).

## 1.0.2 – 2019-02-13
### Changed
- Updated `make-dir` dependency to `2.0.0`.

### Fixed
- Fixed path matching regex for Windows directory structure (PR #4 — thanks to @vuoriliikaluoma).

## 1.0.1 – 2019-01-21
### Fixed
- Fixed `moment-timezone` peer dependency version range.

## 1.0.0 – 2019-01-20
### Added
- First release.
