import { NormalModuleReplacementPlugin } from 'webpack';

declare class MomentTimezoneDataPlugin extends NormalModuleReplacementPlugin {
  /**
   * Reduce moment-timezone data files by filtering which time zones are included in the bundle.
   *
   * @param options At least one filtering option must be provided. The final output will only
   * contain zone data that match _all_ the provided filters.
   */
  constructor(options: MomentTimezoneDataPlugin.Options);
}

declare namespace MomentTimezoneDataPlugin {
  export interface Options {
    /**
     * [Filter] Only include data from this year onwards.
     */
    startYear?: number;
    /**
     * [Filter] Only include data up to (and including) this year.
     */
    endYear?: number;
    /**
     * [Filter] Only include data for time zones with names matching this value.
     * - `string` — Include only this zone name as an exact match.
     * - `RegExp` — Include zones with names matching the regular expression.
     * - Array (of the above types) — Include zones matching any of the values of the array.
     */
    matchZones?: string | RegExp | (string | RegExp)[];
    /**
     * [Filter] Only include data for time zones associated with specific countries, as determined
     * by Moment Timezone’s `zonesForCountry()` API.
     * - `string` — Include zones for this country code as an exact match.
     * - `RegExp` — Include zones for country codes matching the regular expression.
     * - Array (of the above types) — Include zones for country codes matching any of the values of
     * the array.
     */
    matchCountries?: string | RegExp | (string | RegExp)[];
    /**
     * [Config] A path where the generated files will be cached. Defaults to an
     * automatically-generated location.
     */
    cacheDir?: string;
    /**
     * [Config] A custom webpack context for the location of the source Moment Timezone data files.
     * By default, the plugin will look in `node_modules/moment-timezone/`. Use this option if the
     * Moment Timezone library is located somewhere else (e.g. a custom `vendor/` directory).
     */
    momentTimezoneContext?: RegExp;
  }
}

export = MomentTimezoneDataPlugin;
