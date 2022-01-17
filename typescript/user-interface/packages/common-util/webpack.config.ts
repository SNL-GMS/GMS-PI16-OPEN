/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'path';
import { Configuration } from 'webpack';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';

import { WebpackConfig } from '../../webpack-config/types';
import { webpackLibCjsConfig } from '../../webpack-config/webpack.config';
import { getWebpackPaths } from '../../webpack-config/webpack.paths';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = (env?: { [key: string]: any }): Configuration[] | DevServerConfiguration[] => {
  const webpackPaths = getWebpackPaths(resolve(__dirname, '.'));
  const webpackConfig: WebpackConfig = {
    name: 'common-util',
    title: 'GMS Common Util',
    paths: webpackPaths,
    isProduction: env && env.production,
    entry: resolve(webpackPaths.src, 'ts/common-util.ts'),
    alias: {}
  };

  return [webpackLibCjsConfig(webpackConfig)];
};

// eslint-disable-next-line import/no-default-export
export default config;
