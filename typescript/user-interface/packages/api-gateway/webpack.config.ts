/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable import/no-extraneous-dependencies */
import includes from 'lodash/includes';
import { resolve } from 'path';
import { Configuration, DefinePlugin } from 'webpack';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import merge from 'webpack-merge';
import nodeExternals from 'webpack-node-externals';

import { WebpackConfig } from '../../webpack-config/types';
import { webpackNodeConfig } from '../../webpack-config/webpack.config';
import { getWebpackPaths } from '../../webpack-config/webpack.paths';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = (env?: { [key: string]: any }): Configuration[] | DevServerConfiguration[] => {
  const webpackPaths = getWebpackPaths(resolve(__dirname, '.'));

  /* define the external libraries -> not to be bundled */
  // bundling the following libraries cause critical warnings and `config` fails to load correctly
  // Webpack - Critical dependency: the request of a dependency is an expression
  // When a library uses variables or expressions in a require call, Webpack cannot
  // resolve them statically and imports the entire package.
  const externals = ['express', 'config', 'winston', 'winston-daily-rotate-file'];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commonConfig: Configuration | any = {
    externals: [
      nodeExternals({
        // the white list will be included in the library bundle
        whitelist: [
          name => {
            if (includes(externals, name)) {
              return false;
            }
            return true;
          }
        ] as any
      }),
      'bufferutil',
      'utf-8-validate'
    ],
    plugins: [
      // https://github.com/lorenwest/node-config/wiki/Webpack-Usage
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, @typescript-eslint/no-require-imports
      new DefinePlugin({ CONFIG: JSON.stringify(require('config')) })
    ]
  };

  const commonConfg: WebpackConfig = {
    name: undefined,
    title: undefined,
    paths: webpackPaths,
    isProduction: env && env.production,
    entry: undefined,
    alias: {}
  };

  const sohWebpackConfig: WebpackConfig = {
    ...commonConfg,
    name: 'api-soh-gateway',
    title: 'SOH Api Gateway',
    entry: {
      'api-soh-gateway': resolve(webpackPaths.src, 'ts/server/api-soh-gateway-server.ts')
    }
  };

  const getConfig = (c: WebpackConfig, m: string): Configuration | DevServerConfiguration =>
    merge(webpackNodeConfig(c), commonConfig, {
      plugins: [
        new DefinePlugin({
          'process.env.GMS_UI_MODE': JSON.stringify(m)
        }) as any
      ]
    });

  return [getConfig(sohWebpackConfig, 'SOH')];
};

// eslint-disable-next-line import/no-default-export
export default config;
