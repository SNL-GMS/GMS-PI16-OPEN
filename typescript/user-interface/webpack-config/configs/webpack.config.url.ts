/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import { Configuration, RuleSetRule } from 'webpack';

/**
 * URL loader rule set.
 */
const urlLoader: RuleSetRule = {
  loader: 'url-loader',
  options: {
    limit: 100000,
    name: 'resources/[name].[ext]'
  },
  test: /\.(png|gif|jpg|jpeg|svg|xml|woff|woff2|eot|ttf)$/i
};

/**
 * The webpack url configuration.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
export const urlConfig = (isProduction: boolean): Configuration | any => ({
  module: {
    rules: [urlLoader]
  }
});
