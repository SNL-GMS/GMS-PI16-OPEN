/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';
import { Configuration, DefinePlugin, HashedModuleIdsPlugin, IgnorePlugin } from 'webpack';
import merge from 'webpack-merge';

import { WebpackConfig } from './types';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const GitRevisionPlugin = require('git-revision-webpack-plugin');

const gitRevisionPlugin = new GitRevisionPlugin();

/**
 * Returns the version number from the package.json file
 *
 * @param path the path to the package.json file
 */
export const getVersion = (path: string): string =>
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports, import/no-dynamic-require, global-require
  `${require(path).version}.${gitRevisionPlugin.version()}`;

/**
 * Returns the webpack entry
 *
 * @param webpackConfig the webpack configuration
 */
export const getEntry = (webpackConfig: WebpackConfig): { [id: string]: string } => {
  if (typeof webpackConfig.entry === 'string' || webpackConfig.entry instanceof String) {
    const entry = {};
    entry[`${webpackConfig.name}`] = webpackConfig.entry;
    return entry;
  }
  return webpackConfig.entry;
};

/**
 * The webpack common base common configuration
 *
 * @param webpackConfig the webpack configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const commonConfig = (webpackConfig: WebpackConfig): Configuration | any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const common: Configuration | any = {
    plugins: [
      new HashedModuleIdsPlugin(), // so that file hashes don't change unexpectedly

      new CaseSensitivePathsPlugin(),

      new DefinePlugin({
        __VERSION__: `${JSON.stringify(
          getVersion(webpackConfig.paths.packageJson)
        )}.${JSON.stringify(gitRevisionPlugin.commithash())}`,
        'process.env.GIT_VERSION': JSON.stringify(gitRevisionPlugin.version()),
        'process.env.GIT_COMMITHASH': JSON.stringify(gitRevisionPlugin.commithash()),
        'process.env.GIT_BRANCH': JSON.stringify(gitRevisionPlugin.branch())
      }),

      new IgnorePlugin(/^\.\/locale$/, /moment$/),

      new IgnorePlugin(/^encoding$/, /node-fetch/)
    ],
    resolve: {
      alias: webpackConfig.alias,
      extensions: ['.json']
    }
  };
  return common;
};

/**
 * The webpack common base web configuration
 *
 * @param webpackConfig the webpack configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commonWebConfig = (webpackConfig: WebpackConfig): Configuration | any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const common: Configuration | any = merge(commonConfig(webpackConfig), {
    target: 'web',
    node: {
      // Resolve node module use of fs
      fs: 'empty'
    }
  });
  return common;
};

/**
 * The webpack common base node configuration
 *
 * @param webpackConfig the webpack configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const commonNodeConfig = (webpackConfig: WebpackConfig): Configuration | any => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const common: Configuration | any = merge(commonConfig(webpackConfig), {
    target: 'node'
  });
  return common;
};
