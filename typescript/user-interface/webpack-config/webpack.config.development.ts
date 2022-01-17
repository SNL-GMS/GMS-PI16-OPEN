/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import { Configuration, DefinePlugin } from 'webpack';

/**
 * Returns the webpack development configuration.
 *
 * @param paths the paths
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const developmentConfig = (): Configuration | any => ({
  mode: 'development',
  devtool: 'inline-cheap-module-source-map',
  stats: {
    colors: false,
    hash: false,
    timings: true,
    assets: false,
    chunks: false,
    chunkModules: false,
    modules: false,
    children: false
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    })
  ]
});
