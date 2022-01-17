/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { AxiosError } from 'axios';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { createQueryConfig } from './query-util';
/**
 * The effective at times.
 * Pass to react-query's useQuery
 */
export const stationsEffectiveAtTimesQueryConfig: UseQueryObjectConfig<string[], AxiosError> = {
  queryKey: [
    'getStationsEffectiveAtTimes',
    defaultConfig.stationDefinition.services.getStationsEffectiveAtTimes.requestConfig
  ],
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false,
    enabled: true
  }
};
/**
 * Get a config that can be used for ReactQuery queries for getStationsEffectiveAtTimes query
 *
 * @param stationNames - List of station names
 * @param effectiveTime - String representing the effectiveTime
 */
export const getStationsEffectiveAtTimesQueryConfig = (
  stationName: string,
  startTime: string,
  endTime: string
) => {
  const data = JSON.stringify({
    station: {
      name: stationName
    },
    startTime,
    endTime
  });
  // see https://react-query.tanstack.com/guides/dependent-queries
  const builtQueryConfig = createQueryConfig(stationsEffectiveAtTimesQueryConfig, data);
  // make it so the query ONLY fires when stationName is defined
  builtQueryConfig.config.enabled = !!stationName;
  return builtQueryConfig;
};

/**
 * Make a query for the stations effective at times with a given time range,
 * using the getStationsEffectiveAtTimesQueryConfig.
 */
export const useStationsEffectiveAtTimesQuery = (
  stationName: string,
  startTime: string,
  endTime: string
): QueryResult<string[], unknown> => {
  const config = getStationsEffectiveAtTimesQueryConfig(stationName, startTime, endTime);

  return useQuery<string[]>(config);
};
