import { ConfigurationTypes } from '@gms/common-model';
import { convertDurationToMilliseconds, convertDurationToSeconds } from '@gms/common-util';
import { AxiosError, AxiosResponse } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultQuery, Queries } from '~components/client-interface';
import { defaultConfig } from '~config/endpoint-configuration';

/**
 * Converts to the UiSohConfiguration for use by the UI
 */
const handleSohConfigurationQueryResponse = (
  response: AxiosResponse<ConfigurationTypes.SohConfiguration>
): ConfigurationTypes.UiSohConfiguration => {
  const uiResponse: ConfigurationTypes.UiSohConfiguration = {
    reprocessingPeriodSecs: convertDurationToSeconds(
      response.data.stationSohControlConfiguration.reprocessingPeriod
    ),
    displayedStationGroups: response.data.stationSohControlConfiguration.displayedStationGroups,
    rollupStationSohTimeToleranceMs: convertDurationToMilliseconds(
      response.data.stationSohControlConfiguration.rollupStationSohTimeTolerance
    ),
    redisplayPeriodMs: convertDurationToMilliseconds(
      response.data.stationSohMonitoringDisplayParameters.redisplayPeriod
    ),
    acknowledgementQuietMs: convertDurationToMilliseconds(
      response.data.stationSohMonitoringDisplayParameters.acknowledgementQuietDuration
    ),
    availableQuietTimesMs: response.data.stationSohMonitoringDisplayParameters.availableQuietDurations.map(
      convertDurationToMilliseconds
    ),
    sohStationStaleMs: convertDurationToMilliseconds(
      response.data.stationSohMonitoringDisplayParameters.sohStationStaleDuration
    ),
    sohHistoricalTimesMs: response.data.stationSohMonitoringDisplayParameters.sohHistoricalDurations.map(
      convertDurationToMilliseconds
    ),
    historicalSamplesPerChannel:
      response.data.stationSohMonitoringDisplayParameters.samplesPerChannel,
    maxHistoricalQueryIntervalSizeMs:
      response.data.stationSohMonitoringDisplayParameters.maxQueryIntervalSize
  };
  return uiResponse;
};

const sohRequestConfig = cloneDeep(
  defaultConfig.sohConfiguration.services.getSohConfiguration.requestConfig
);

/**
 * The Soh Configuration query configuration.
 * Pass to react-query's useQuery
 */
export const sohConfigurationQueryConfig: UseQueryObjectConfig<
  ConfigurationTypes.UiSohConfiguration,
  AxiosError
> = {
  queryKey: ['sohConfiguration', sohRequestConfig],
  queryFn: defaultQuery(handleSohConfigurationQueryResponse),
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * Make a query for the Soh Configuration, using the sohConfigurationQueryConfig.
 * This is the easiest way to get UI Common Configuration values.
 */
export const useSohConfigurationQuery = (): QueryResult<
  ConfigurationTypes.UiSohConfiguration,
  unknown
> => useQuery<ConfigurationTypes.UiSohConfiguration>(sohConfigurationQueryConfig);

/**
 * Use with compose to inject the Soh Configuration query into the component.
 * ie: compose(...otherStuff, withSohConfigurationQuery)(ExampleComponent);
 * ExampleComponent now contains the query results in a prop called sohConfigurationQuery
 */
export const withSohConfigurationQuery = <T>() =>
  Queries.QueryUtils.buildQueryInjector<T, ConfigurationTypes.UiSohConfiguration, AxiosError>(
    'sohConfigurationQuery',
    sohConfigurationQueryConfig
  );
