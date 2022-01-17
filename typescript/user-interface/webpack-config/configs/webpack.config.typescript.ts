/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import { TsconfigPathsPlugin } from 'tsconfig-paths-webpack-plugin';
import { Configuration, Plugin, RuleSetRule } from 'webpack';

import { WebpackPaths } from '../types';

/**
 * Typescript loader rule set.
 *
 * @param paths the paths
 */
const tsLoader = (nodeModules: string): RuleSetRule => ({
  test: /\.ts(x?)$/,
  exclude: [nodeModules, /.*node_modules.*/],
  use: {
    loader: 'ts-loader',
    options: {
      transpileOnly: true
    }
  }
});

/**
 * Mjs loader rule set.
 *
 * @param paths the paths
 */
const mjsLoader = (): RuleSetRule => ({
  test: /\.mjs$/,
  type: 'javascript/auto'
});

/**
 * Typescript plugins.
 *
 * @param tsconfig the path to the tsconfig file
 * @param eslint the path to the eslint file
 * @param src the path to the src file
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
const tsPlugins = (tsconfig: string, eslint: string, src: string): Plugin[] | any[] => {
  const disableTypescript = process.env.DISABLE_ESLINT && process.env.DISABLE_TYPESCRIPT === 'true';
  const enableTypescript = !(disableTypescript ?? false);
  const disableEslint = process.env.DISABLE_ESLINT && process.env.DISABLE_ESLINT === 'true';
  const enableEslint = !(disableEslint ?? false);
  console.log(`ForkTsCheckerWebpackPlugin typescript: ${enableTypescript} eslint: ${enableEslint}`);
  return enableTypescript || enableEslint
    ? [
        new ForkTsCheckerWebpackPlugin({
          async: true,
          typescript: {
            enabled: enableTypescript,
            build: true,
            configFile: tsconfig,
            diagnosticOptions: {
              semantic: true,
              syntactic: true
            }
          },
          eslint: {
            enabled: enableEslint,
            files: `${src}/**/*.{ts,tsx}`,
            options: {
              configFile: eslint,
              fix: false,
              cache: true,
              cacheFile: '.eslintcache',
              extensions: ['ts', 'tsx']
            }
          },
          issue: {
            exclude: [
              {
                origin: 'eslint',
                severity: 'warning'
              }
            ]
          }
        })
      ]
    : [];
};

/**
 * The webpack typescript configuration.
 *
 * @param paths the paths
 * @param isProduction true if production, false otherwise
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const tsConfig = (paths: WebpackPaths, isProduction: boolean): Configuration | any => ({
  module: {
    rules: [tsLoader(paths.nodeModules), mjsLoader()]
  },
  plugins: [...tsPlugins(paths.tsconfig, paths.eslint, paths.src)],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.tsx'],
    plugins: [
      new TsconfigPathsPlugin({
        baseUrl: paths.baseDir,
        configFile: paths.tsconfig
      })
    ]
  }
});
