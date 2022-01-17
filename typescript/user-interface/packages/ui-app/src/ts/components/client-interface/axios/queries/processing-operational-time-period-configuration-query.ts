import { ConfigurationTypes } from '@gms/common-model';
import { convertDurationToSeconds } from '@gms/common-util';
import { AxiosError, AxiosResponse } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { buildQueryInjector, defaultQuery } from './query-util';

/**
 * Converts to the Operation Time Period durations for use by the UI
 */
const handleOperationalTimePeriodConfigurationQueryResponse = (
  response: AxiosResponse<ConfigurationTypes.OperationalTimePeriodConfigurationOSD>
): ConfigurationTypes.OperationalTimePeriodConfiguration => {
  const convertedResponse: ConfigurationTypes.OperationalTimePeriodConfiguration = {
    operationalPeriodStartSecs: convertDurationToSeconds(response.data.operationalPeriodStart),
    operationalPeriodEndSecs: convertDurationToSeconds(response.data.operationalPeriodEnd)
  };
  return convertedResponse;
};

/**
 * Create the two Request Configs global.operation-time-period
 */
const processingOperationalTimePeriodRequestConfig = cloneDeep(
  defaultConfig.processingConfiguration.services.getProcessingConfiguration.requestConfig
);
processingOperationalTimePeriodRequestConfig.data = {
  configName: ConfigurationTypes.OperationalTimePeriodConfigs.DEFAULT,
  selectors: []
};

/**
 * The Processing Operational Time -Period Configuration query configuration.
 * Pass to react-query's useQuery
 */
export const operationalTimePeriodConfigurationQueryConfig: UseQueryObjectConfig<
  ConfigurationTypes.OperationalTimePeriodConfiguration,
  AxiosError
> = {
  queryKey: [
    'processingOperationalTimePeriodConfiguration',
    processingOperationalTimePeriodRequestConfig
  ],
  queryFn: defaultQuery(handleOperationalTimePeriodConfigurationQueryResponse),
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * Make a query for the UI Processing Configuration, using the useOperationalTimePeriodConfigurationQuery.
 * This is the easiest way to get Operational Time Period Configuration values.
 */
export const useOperationalTimePeriodConfigurationQuery = (): QueryResult<
  ConfigurationTypes.OperationalTimePeriodConfiguration,
  unknown
> =>
  useQuery<ConfigurationTypes.OperationalTimePeriodConfiguration>(
    operationalTimePeriodConfigurationQueryConfig
  );

/**
 * Use with compose to inject the UI Processing Configuration query into the component.
 * ie: compose(...otherStuff, withOperationalTimePeriodConfigurationQuery)(ExampleComponent);
 * ExampleComponent now contains the query results in a prop called useOperationalTimePeriodConfigurationQuery
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const withOperationalTimePeriodConfigurationQuery = <T>() =>
  buildQueryInjector<T, ConfigurationTypes.OperationalTimePeriodConfiguration, AxiosError>(
    'operationalTimePeriodConfigurationQuery',
    operationalTimePeriodConfigurationQueryConfig
  );
