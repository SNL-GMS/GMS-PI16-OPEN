/* eslint-disable import/no-extraneous-dependencies */
import { resolve } from 'path';
import { Configuration } from 'webpack';
import webpackMerge from 'webpack-merge';

import { WebpackConfig } from '../../webpack-config/types';
import { webpackNodeConfig } from '../../webpack-config/webpack.config';
import { getWebpackPaths } from '../../webpack-config/webpack.paths';

// TODO: Figure out why we get a Configuration type mismatch from webpackMerge and this return type.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const config = (env?: { [key: string]: any }): Configuration[] | any[] => {
  const webpackPaths = getWebpackPaths(resolve(__dirname, '.'));
  const webpackConfig: WebpackConfig = {
    name: 'mock-data-server',
    title: 'GMS Mock Data Server',
    paths: webpackPaths,
    isProduction: env?.production,
    entry: resolve(webpackPaths.src, 'ts/server.ts'),
    alias: {}
  };

  return [
    webpackMerge(webpackNodeConfig(webpackConfig), {
      externals: [
        // Special treatment for errorhandler. See https://github.com/typicode/json-server/issues/855
        {
          errorhandler: '{}'
        }
      ],
      stats: {
        // Suppress the warning that all of express is bundled in. We need express to run the app.
        warningsFilter: [/Critical dependency:/]
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any
  ];
};

// eslint-disable-next-line import/no-default-export
export default config;
