/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'path';
import { Configuration } from 'webpack';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';

import { WebpackConfig } from '../../webpack-config/types';
import { webpackAppConfig, webpackLibCjsConfig } from '../../webpack-config/webpack.config';
import { getWebpackPaths } from '../../webpack-config/webpack.paths';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = (env?: { [key: string]: any }): Configuration[] | DevServerConfiguration[] => {
  const webpackPaths = getWebpackPaths(resolve(__dirname, '.'));
  const webpackConfig: WebpackConfig = {
    name: 'weavess',
    title: 'WEAVESS',
    paths: webpackPaths,
    isProduction: env && env.production,
    entry:
      env && env.devserver
        ? resolve(webpackPaths.src, 'ts/examples/index.tsx')
        : resolve(webpackPaths.src, 'ts/weavess.tsx'),
    alias: {}
  };

  return env && env.devserver
    ? [webpackAppConfig(webpackConfig)]
    : [webpackLibCjsConfig(webpackConfig)];
};

// eslint-disable-next-line import/no-default-export
export default config;
