/* eslint-disable import/no-extraneous-dependencies, import/no-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { APP_PREFIX_PATH } from '@gms/common-util';
import gitprocess from 'child_process';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { join, resolve } from 'path';
import { Configuration, DefinePlugin } from 'webpack';
import { Configuration as DevServerConfiguration } from 'webpack-dev-server';
import merge from 'webpack-merge';

import { cesiumConfig } from '../../webpack-config/configs/webpack.config.cesium';
import { WebpackConfig, WebpackPaths } from '../../webpack-config/types';
import { webpackAppConfig } from '../../webpack-config/webpack.config';
import { getWebpackPaths } from '../../webpack-config/webpack.paths';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const fs = require('fs');

const getGitHash = () => gitprocess.execSync('git rev-parse --short HEAD').toString();

const getGitBranch = () => gitprocess.execSync('git rev-parse --abbrev-ref HEAD').toString();

/**
 * Should the UI show developer tools?
 */
const shouldShowDevtools = (
  process.env.NODE_ENV === 'development' ||
  !('NODE_ENV' in process.env) ||
  process.env.SHOW_DEVTOOLS === 'true' ||
  'false'
).toString();

/**
 * Get the version info so that the environment variable can be set
 */
const HASH_LENGTH = 8;
const versionNumber =
  process.env.CI_COMMIT_REF_NAME ?? process.env.GIT_BRANCH ?? getGitBranch() ?? 'development';
const commitSHA = String(process.env.CI_COMMIT_SHA ?? getGitHash() ?? 'unknown').substr(
  0,
  HASH_LENGTH
);

/**
 * Queries the published 'sound' directory and returns a list of the
 * available sound files.
 *
 * Note: this assumes that there are only files (no additional directories)
 */
const getAllFilesFromFolder = (dir: string, pattern?: RegExp): string[] => {
  const results: string[] = [];
  fs.readdirSync(dir)
    .filter((file: string) => !pattern || file.match(pattern))
    .forEach((file: string) => {
      results.push(file);
    });
  return results;
};

const defaultMockDataServerUri = 'http://localhost:3001';
const graphqlProxyUri = process.env.GRAPHQL_PROXY_URI || `http://localhost:3000`;
const processingConfigurationProxyUri =
  process.env.PROCESSING_CONFIGURATION_PROXY_URI || defaultMockDataServerUri;
const ssamRetrieveDecimatedHistoricalStationSoh =
  process.env.SSAM_CONTROL_PROXY_URI ||
  process.env.SSAM_RETRIEVE_DECIMATED_HISTORICAL_STATION_SOH_URL ||
  `http://localhost:3000`;
const ssamRetrieveStationSohMonitoringUiClientParameters =
  process.env.SSAM_CONTROL_PROXY_URI ||
  process.env.SSAM_RETRIEVE_STATION_SOH_MONITORING_UI_CLIENT_PARAMS_URL ||
  defaultMockDataServerUri;
const stationDefinitionServiceUri =
  process.env.STATION_DEFINITION_SERVICE_URL || defaultMockDataServerUri;
const subscriptionsProxyUri = process.env.SUBSCRIPTIONS_PROXY_URI || `ws://localhost:4000`;
const systemMessageDefinitionProxyUri =
  process.env.SYSTEM_MESSAGE_DEFINITION_PROXY_URI || defaultMockDataServerUri;
const userManagerProxyUri = process.env.USER_MANAGER_PROXY_URI || defaultMockDataServerUri;
const waveformManagerProxyUri = process.env.WAVEFORM_MANAGER_PROXY_URI || `http://localhost:3002`;
const workflowManagerProxyUri = process.env.WORKFLOW_MANAGER_PROXY_URI || `http://localhost:3003`;
const authProxyUri = process.env.AUTH_PROXY_URI || graphqlProxyUri;
const rigUri = process.env.RIG_URI || `http://localhost:4000`;
const rigWsUri = process.env.RIG_WS_URI || `ws://localhost:4000`;

const config = (env?: { [key: string]: any }): Configuration[] | DevServerConfiguration[] => {
  const webpackSohPaths = getWebpackPaths(
    resolve(__dirname, '.'),
    true /* indicate that workspaces are being used */,
    'soh'
  );

  const webpackIanPaths = getWebpackPaths(
    resolve(__dirname, '.'),
    true /* indicate that workspaces are being used */,
    'ian'
  );

  const webpackLegacyPaths = getWebpackPaths(
    resolve(__dirname, '.'),
    true /* indicate that workspaces are being used */,
    'legacy'
  );

  const availableSoundFiles = getAllFilesFromFolder(
    join(webpackSohPaths.baseDir, 'sounds'),
    /.mp3$/
  ).join(';');

  // eslint-disable-next-line no-console
  console.log(`Configured available sound files: ${availableSoundFiles}`);

  const commonProxyRouteConfig = {
    // !WARNING: A backend server running on HTTPS with an invalid certificate
    // !will not be accepted by default - must set to false to accept
    secure: false,
    changeOrigin: true,
    logLevel: 'warn'
  };

  const devServerConfig: Configuration | any =
    env && env.devserver
      ? {
          devServer: {
            https: false,
            proxy: {
              '/interactive-analysis-api-gateway/alive': {
                target: graphqlProxyUri,
                ...commonProxyRouteConfig
              },
              '/interactive-analysis-api-gateway/ready': {
                target: graphqlProxyUri,
                ...commonProxyRouteConfig
              },
              '/interactive-analysis-api-gateway/health-check': {
                target: graphqlProxyUri,
                ...commonProxyRouteConfig
              },
              '/interactive-analysis-api-gateway/graphql': {
                target: graphqlProxyUri,
                ...commonProxyRouteConfig
              },
              '/interactive-analysis-api-gateway/subscriptions': {
                target: subscriptionsProxyUri,
                ws: true,
                ...commonProxyRouteConfig
              },
              '/interactive-analysis-api-gateway/auth': {
                target: authProxyUri,
                ...commonProxyRouteConfig
              },
              '/reactive-interaction-gateway/rig/_rig/*/subscriptions': {
                target: rigUri,
                pathRewrite: { '^/reactive-interaction-gateway/rig': '' },
                ...commonProxyRouteConfig
              },
              '/reactive-interaction-gateway/rig/_rig': {
                target: rigWsUri,
                ...commonProxyRouteConfig,
                pathRewrite: { '^/reactive-interaction-gateway/rig': '' },
                ws: true
              },
              '/user-manager-service/user-preferences': {
                target: userManagerProxyUri,
                ...commonProxyRouteConfig
              },
              '/ui-processing-configuration-service': {
                target: processingConfigurationProxyUri,
                ...commonProxyRouteConfig
              },
              '/smds-service/retrieve-system-message-definitions': {
                target: systemMessageDefinitionProxyUri,
                ...commonProxyRouteConfig
              },
              '/ssam-control/retrieve-decimated-historical-station-soh': {
                target: ssamRetrieveDecimatedHistoricalStationSoh,
                ...commonProxyRouteConfig
              },
              '/ssam-control/retrieve-station-soh-monitoring-ui-client-parameters': {
                target: ssamRetrieveStationSohMonitoringUiClientParameters,
                ...commonProxyRouteConfig
              },
              '/station-definition-service/': {
                target: stationDefinitionServiceUri,
                ...commonProxyRouteConfig
              },
              '/waveform-manager-service/': {
                target: waveformManagerProxyUri,
                ...commonProxyRouteConfig
              },
              '/workflow-manager-service/': {
                target: workflowManagerProxyUri,
                ...commonProxyRouteConfig
              }
            }
          }
        }
      : undefined;

  const commonConfig: WebpackConfig = {
    name: undefined,
    title: undefined,
    paths: undefined,
    entry: undefined,
    isProduction: env && env.production,
    htmlWebpackPluginOptions: {
      cesiumScript: '<script src="./cesium/Cesium.js"></script>'
    },
    alias: {}
  };

  const legacyWebpackConfig: WebpackConfig = {
    ...commonConfig,
    name: 'ui-legacy-app',
    title: 'GMS Interactive Analysis (Legacy)',
    paths: webpackLegacyPaths,
    entry: {
      'ui-legacy-app': resolve(webpackLegacyPaths.src, 'ts/app/ui-legacy-app/index.tsx')
    }
  };

  const ianWebpackConfig: WebpackConfig = {
    ...commonConfig,
    name: 'ui-ian-app',
    title: 'GMS Interactive Analysis',
    paths: webpackIanPaths,
    entry: {
      'ui-ian-app': resolve(webpackIanPaths.src, 'ts/app/ui-ian-app/index.tsx')
    }
  };

  const sohWebpackConfig: WebpackConfig = {
    ...commonConfig,
    name: 'ui-soh-app',
    title: 'GMS SOH Monitoring',
    paths: webpackSohPaths,
    entry: {
      'ui-soh-app': resolve(webpackSohPaths.src, 'ts/app/ui-soh-app/index.tsx')
    }
  };

  const getCommonConfig = (mode: string, webpackPaths: WebpackPaths): Configuration | any => {
    const cfg: Configuration | any = merge(
      {
        externals: {
          electron: 'electron'
        },
        plugins: [
          new CopyWebpackPlugin([
            {
              from: join(webpackPaths.baseDir, `sounds`),
              to: resolve(webpackPaths.dist, `${APP_PREFIX_PATH}/sounds`)
            }
          ]),
          new DefinePlugin({
            'process.env.AVAILABLE_SOUND_FILES': JSON.stringify(availableSoundFiles)
          }) as any
        ]
      },
      cesiumConfig(webpackPaths, env && env.production)
    );

    return merge(cfg, {
      plugins: [
        new DefinePlugin({
          'process.env.GMS_UI_MODE': JSON.stringify(mode)
        }) as any,
        new DefinePlugin({
          'process.env.VERSION_NUMBER': JSON.stringify(versionNumber)
        }) as any,
        new DefinePlugin({
          'process.env.COMMIT_SHA': JSON.stringify(commitSHA)
        }) as any,
        new DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
        }) as any,
        new DefinePlugin({
          'process.env.SHOW_DEVTOOLS': JSON.stringify(shouldShowDevtools)
        }) as any,
        new DefinePlugin({
          'process.env.PERFORMANCE_MONITORING_ENABLED': JSON.stringify(
            process.env.PERFORMANCE_MONITORING_ENABLED
          )
        }) as any
      ]
    });
  };

  const legacyCommonConfig: Configuration | any = getCommonConfig('LEGACY', webpackLegacyPaths);
  const ianCommonConfig: Configuration | any = getCommonConfig('IAN', webpackIanPaths);
  const sohCommonConfig: Configuration | any = getCommonConfig('SOH', webpackSohPaths);

  if (env) {
    if (env.ian) {
      return [merge(webpackAppConfig(ianWebpackConfig), ianCommonConfig, devServerConfig)];
    }
    if (env.soh) {
      return [merge(webpackAppConfig(sohWebpackConfig), sohCommonConfig, devServerConfig)];
    }
    if (env.legacy) {
      return [merge(webpackAppConfig(legacyWebpackConfig), legacyCommonConfig, devServerConfig)];
    }
  }
  return [
    merge(webpackAppConfig(ianWebpackConfig), ianCommonConfig, devServerConfig),
    merge(webpackAppConfig(sohWebpackConfig), sohCommonConfig, devServerConfig)
  ];
};

// eslint-disable-next-line import/no-default-export
export default config;
