import { ConfigurationTypes } from '@gms/common-model';
import { MILLISECONDS_IN_SECOND, toEpochSeconds } from '@gms/common-util';
import { AxiosError, AxiosResponse } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { buildQueryInjector, defaultQuery } from './query-util';

/**
 * Converts to the Analyst Configuration durations and Current Interval end time for use by the UI
 */
const handleProcessingAnalystConfigurationQueryResponse = (
  response: AxiosResponse<ConfigurationTypes.ProcessingAnalystConfigurationOSD>
): ConfigurationTypes.ProcessingAnalystConfiguration => {
  // if the currentIntervalEndTime is set to "UserCurrentTime" then we will use current time from Date.now
  // else use value set
  let currentIntervalEndTime;
  if (
    response.data?.currentIntervalEndTime === 'UserCurrentTime' ||
    !response.data?.currentIntervalEndTime
  ) {
    // Then available and current interval end times are now.
    currentIntervalEndTime = Date.now() / MILLISECONDS_IN_SECOND;
  } else {
    currentIntervalEndTime = toEpochSeconds(response.data.currentIntervalEndTime);
  }

  return {
    ...response.data,
    currentIntervalEndTime
  };
};

/**
 * Create the Request Config for ui.analyst-config
 */
const processingAnalystRequestConfig = cloneDeep(
  defaultConfig.processingConfiguration.services.getProcessingConfiguration.requestConfig
);
processingAnalystRequestConfig.data = {
  configName: ConfigurationTypes.AnalystConfigs.DEFAULT,
  selectors: []
};

/**
 * The Processing Analyst Configuration query configuration.
 * Pass to react-query's useQuery
 */
export const processingAnalystConfigurationQueryConfig: UseQueryObjectConfig<
  ConfigurationTypes.ProcessingAnalystConfiguration,
  AxiosError
> = {
  queryKey: ['processingAnalystConfiguration', processingAnalystRequestConfig],
  queryFn: defaultQuery(handleProcessingAnalystConfigurationQueryResponse),
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * Make a query for the UI Processing Configuration, using the useProcessingAnalystConfigurationQuery.
 * This is the easiest way to get UI Analyst Configuration values.
 */
export const useProcessingAnalystConfigurationQuery = (): QueryResult<
  ConfigurationTypes.ProcessingAnalystConfiguration,
  unknown
> =>
  useQuery<ConfigurationTypes.ProcessingAnalystConfiguration>(
    processingAnalystConfigurationQueryConfig
  );

/**
 * Use with compose to inject the UI Processing Configuration query into the component.
 * ie: compose(...otherStuff, withProcessingAnalystConfigurationQuery)(ExampleComponent);
 * ExampleComponent now contains the query results in a prop called useProcessingAnalystConfigurationQuery
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withProcessingAnalystConfigurationQuery = <T>() =>
  buildQueryInjector<T, ConfigurationTypes.ProcessingAnalystConfiguration, AxiosError>(
    'processingAnalystConfigurationQuery',
    processingAnalystConfigurationQueryConfig
  );
