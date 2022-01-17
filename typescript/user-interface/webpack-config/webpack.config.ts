/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import { appConfig } from './webpack.config.app';
import { libCjsConfig, libUmdConfig } from './webpack.config.lib';
import { nodeConfig } from './webpack.config.node';

/**
 * The webpack configuration for libraries (commonJS)
 *
 * @param webpackConfig the webpack configuration
 */
export const webpackLibUmdConfig = libUmdConfig;

/**
 * The webpack configuration for libraries (umd)
 *
 * @param webpackConfig the webpack configuration
 */
export const webpackLibCjsConfig = libCjsConfig;

/**
 * The webpack configuration for applications
 *
 * @param webpackConfig the webpack configuration
 */
export const webpackAppConfig = appConfig;

/**
 * The webpack configuration for node applications
 *
 * @param webpackConfig the webpack configuration
 */
export const webpackNodeConfig = nodeConfig;
