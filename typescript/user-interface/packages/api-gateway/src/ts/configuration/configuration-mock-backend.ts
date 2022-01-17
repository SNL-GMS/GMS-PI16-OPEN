import { ConfigurationTypes } from '@gms/common-model';
import { readJsonData } from '@gms/common-util';
import config from 'config';
import Immutable from 'immutable';
// eslint-disable-next-line import/no-extraneous-dependencies
import path from 'path';

import { gatewayLogger as logger } from '../log/gateway-logger';
import { HttpMockWrapper } from '../util/http-wrapper';
import { resolveTestDataPaths } from '../util/test-data-util';

/**
 * Mock backend HTTP services providing access to configuration data. If mock services are enabled in the
 * configuration file, this module loads a test data set specified in the configuration file and configures
 * mock HTTP interfaces for the API gateway backend service calls.
 */

/** Declare a backend data store for the mock configuration backend */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dataStore: Immutable.Map<string, any> = Immutable.Map<string, any>();

/**
 * Configure mock HTTP interfaces for a simulated set of configuration backend services.
 *
 * @param httpMockWrapper The HTTP mock wrapper used to configure mock backend service interfaces
 */
export function initialize(httpMockWrapper: HttpMockWrapper): void {
  logger.info('Initializing mock backend for analysis configuration data');

  if (!httpMockWrapper) {
    throw new Error(
      'Cannot initialize mock configuration services with undefined HTTP mock wrapper'
    );
  }

  // Load test data from the configured data set
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  loadTestData();

  // Load the configuration backend service config settings
  const backendConfig = config.get('configuration.backend');
  httpMockWrapper.onMock(
    backendConfig.services.getAnalystConfiguration.requestConfig.url,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getConfiguration
  );
  httpMockWrapper.onMock(
    backendConfig.services.getSohConfiguration.requestConfig.url,
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getSohConfiguration
  );
}

/**
 * Load test data into the mock backend data store from the configured test data set.
 * Put them into the data store map
 */
function loadTestData(): void {
  const dataPath = resolveTestDataPaths().additionalDataHome;
  const additionalTestData = config.get('testData.additionalTestData');

  // ui config
  const analystConfigurationFile = path.join(
    dataPath,
    additionalTestData.analystConfigurationFilename
  );
  logger.info(`Loading configuration test data from path: ${analystConfigurationFile}`);

  let defaultAnalystConfiguration: ConfigurationTypes.ProcessingAnalystConfiguration;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultAnalystConfiguration = readJsonData(analystConfigurationFile) as any;
    logger.info(`Mock backend configuration loaded.`);
  } catch (e) {
    logger.error(
      `Failed to read configuration data from files: ` +
        `${additionalTestData.analystConfigurationFilename}`
    );
  }
  dataStore = dataStore.set(ConfigurationTypes.AnalystConfigs.DEFAULT, defaultAnalystConfiguration);

  // common config
  const commonConfigurationFile = path.join(
    dataPath,
    additionalTestData.commonConfigurationFilename
  );
  logger.info(`Loading configuration test data from path: ${commonConfigurationFile}`);

  let commonConfiguration: ConfigurationTypes.ProcessingCommonConfiguration;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    commonConfiguration = readJsonData(commonConfigurationFile) as any;
    logger.info(`Mock backend common configuration loaded.`);
  } catch (e) {
    logger.error(
      `Failed to read configuration data from files: ` +
        `${additionalTestData.commonConfigurationFilename}`
    );
  }
  dataStore = dataStore.set(ConfigurationTypes.CommonConfigs.DEFAULT, commonConfiguration);

  // soh ui config
  const uiSohConfigurationFile = path.join(dataPath, additionalTestData.uiSohConfigurationFileName);
  logger.info(`Loading soh configuration test data from path: ${uiSohConfigurationFile}`);
  let uiSohConfig: ConfigurationTypes.SohConfiguration;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    uiSohConfig = readJsonData(uiSohConfigurationFile) as any;
    logger.info(`Mock backend soh configuration loaded.`);
  } catch (e) {
    logger.error(
      `Failed to read configuration data from files: ` +
        `${additionalTestData.analystConfigurationFilename}`
    );
  }
  dataStore = dataStore.set(ConfigurationTypes.SohConfig, uiSohConfig);
}

/**
 * Retrieves the analyst configuration based on a user role
 *
 * @param configName configuration to retrieve
 * @returns a configuration
 */
function getConfiguration(parameters: {
  configName: string;
  selectors: ConfigurationTypes.Selector[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
}): any {
  // Handle undefined input
  if (!parameters.configName) {
    throw new Error('Unable to retrieve Configuration for undefined config name');
  }

  // Handle uninitialized data store
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  handleUninitializedDataStore();
  const configuration = dataStore.get(parameters.configName);
  if (parameters.selectors.length <= 0) {
    return configuration;
  }
  // if there are selectors - we need to get processing config
  const monitorType = parameters.selectors[0].value;
  const monitorTypeConfiguration = configuration[monitorType];
  let selectorIndex = parameters.selectors.length - 1;
  let configToReturn = monitorTypeConfiguration[parameters.selectors[selectorIndex].value];
  while (selectorIndex > 1 && configToReturn === undefined) {
    selectorIndex -= 1;
    configToReturn = monitorTypeConfiguration[parameters.selectors[selectorIndex].value];
  }
  // if no channel or station was found - get the default
  return configToReturn || configuration[parameters.selectors[0].value].default;
}

/**
 * Retrieves the analyst configuration based on a user role
 *
 * @param string of no consequence
 * @returns a configuration
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSohConfiguration(): any {
  // Handle uninitialized data store
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  handleUninitializedDataStore();
  return dataStore.get(ConfigurationTypes.SohConfig);
}

/**
 * Handle cases where the data store has not been initialized.
 */
function handleUninitializedDataStore() {
  // If the data store is uninitialized, throw an error
  if (!dataStore) {
    throw new Error('Mock backend configuration data store has not been initialized');
  }
}
