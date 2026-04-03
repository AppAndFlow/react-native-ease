const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withMetroConfig } = require('react-native-monorepo-config');
const { withUniwindConfig } = require('uniwind/metro');

const root = path.resolve(__dirname, '..');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const baseConfig = withMetroConfig(getDefaultConfig(__dirname), {
  root,
  dirname: __dirname,
});

const config = withUniwindConfig(baseConfig, {
  cssEntryFile: './global.css',
  // (optional) path where we gonna auto-generate typings
  // keep it inside src so it stays scoped to the example app
  dtsFile: './src/uniwind-types.d.ts',
});

module.exports = config;
