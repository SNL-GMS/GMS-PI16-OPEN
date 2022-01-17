import { ConfigurationTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { buildQueryInjector } from './query-util';

/**
 * Create the Request Config for station-definition-manager.station-group-names
 */
const processingStationGroupNamesRequestConfig = cloneDeep(
  defaultConfig.processingConfiguration.services.getProcessingConfiguration.requestConfig
);
processingStationGroupNamesRequestConfig.data = {
  configName: ConfigurationTypes.StationGroupNamesConfig.DEFAULT,
  selectors: []
};

/**
 * The Processing Station Group Names Configuration query configuration.
 * Pass to react-query's useQuery
 */
export const processingStationGroupNamesConfigurationQueryConfig: UseQueryObjectConfig<
  ConfigurationTypes.StationGroupNamesConfiguration,
  AxiosError
> = {
  queryKey: [
    'processingStationGroupNamesConfigurationQuery',
    processingStationGroupNamesRequestConfig
  ],
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * Make a query for the UI Processing Configuration, using the useProcessingStationGroupNamesConfigurationQuery.
 * This is the easiest way to get UI Station Group Names Configuration values.
 */
export const useProcessingStationGroupNamesConfigurationQuery = (): QueryResult<
  ConfigurationTypes.StationGroupNamesConfiguration,
  unknown
> =>
  useQuery<ConfigurationTypes.StationGroupNamesConfiguration>(
    processingStationGroupNamesConfigurationQueryConfig
  );

/**
 * Use with compose to inject the UI Processing Configuration query into the component.
 * ie: compose(...otherStuff, withProcessingStationGroupNamesConfigurationQuery)(ExampleComponent);
 * ExampleComponent now contains the query results in a prop called useProcessingStationGroupNamesConfigurationQuery
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withProcessingStationGroupNamesConfigurationQuery = <T>() =>
  buildQueryInjector<T, ConfigurationTypes.StationGroupNamesConfiguration, AxiosError>(
    'processingStationGroupNamesConfigurationQuery',
    processingStationGroupNamesConfigurationQueryConfig
  );
