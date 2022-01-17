/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
import { resolve } from 'path';
import { Configuration } from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

/**
 * Analyzes the webpack analyze bundle configuration.
 *
 * @param path the directory path the bundle analysis should be written to
 * @param name the name of report of the bundle analysis
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const bundleAnalyzeConfig = (path: string, name: string): Configuration | any => ({
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: resolve(path, `${name}.html`),
      generateStatsFile: true,
      statsFilename: resolve(path, `${name}.json`)
    })
  ]
});
