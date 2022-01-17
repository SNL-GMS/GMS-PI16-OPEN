// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// The plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// Https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to the project's config changing)
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-extraneous-dependencies
const wp = require('@cypress/webpack-preprocessor');

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-extraneous-dependencies
const { initPlugin } = require('cypress-plugin-snapshots/plugin');

module.exports = (on, config) => {
  const options = {
    // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
    webpackOptions: require('../../webpack.config')
  };
  on('file:preprocessor', wp(options));
  // eslint-disable-next-line no-param-reassign
  config.env.GMS_UI_MODE = process.env.GMS_UI_MODE;
  // eslint-disable-next-line no-console
  console.log('Running in mode:', config.env.GMS_UI_MODE);
  initPlugin(on, config);
  return config;
};
