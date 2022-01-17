import { ConfigurationTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { buildQueryInjector } from './query-util';

/**
 * Create the Request Config for ui.common-config
 */
const processingCommonRequestConfig = cloneDeep(
  defaultConfig.processingConfiguration.services.getProcessingConfiguration.requestConfig
);
processingCommonRequestConfig.data = {
  configName: ConfigurationTypes.CommonConfigs.DEFAULT,
  selectors: []
};

/**
 * The Processing Common Configuration query configuration.
 * Pass to react-query's useQuery
 */
export const processingCommonConfigurationQueryConfig: UseQueryObjectConfig<
  ConfigurationTypes.ProcessingCommonConfiguration,
  AxiosError
> = {
  queryKey: ['processingCommonConfiguration', processingCommonRequestConfig],
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * Make a query for the UI Processing Configuration, using the uiCommonConfigurationQueryConfig.
 * This is the easiest way to get UI Common Configuration values.
 */
export const useProcessingCommonConfigurationQuery = (): QueryResult<
  ConfigurationTypes.ProcessingCommonConfiguration,
  unknown
> =>
  useQuery<ConfigurationTypes.ProcessingCommonConfiguration>(
    processingCommonConfigurationQueryConfig
  );

/**
 * Use with compose to inject the UI Processing Common Configuration query into the component.
 * ie: compose(...otherStuff, withProcessingCommonConfigurationQuery)(ExampleComponent);
 * ExampleComponent now contains the query results in a prop called useProcessingCommonConfigurationQuery
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withProcessingCommonConfigurationQuery = <T>() =>
  buildQueryInjector<T, ConfigurationTypes.ProcessingCommonConfiguration, AxiosError>(
    'processingCommonConfigurationQuery',
    processingCommonConfigurationQueryConfig
  );
