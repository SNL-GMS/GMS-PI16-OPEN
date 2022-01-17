/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { StationTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { createQueryConfig } from '~components/client-interface/axios/queries/query-util';
import { defaultConfig } from '~config/endpoint-configuration';

// CONFIG

/**
 * The station definitions.
 * Pass to react-query's useQuery
 */
export const stationGroupsQueryConfig: UseQueryObjectConfig<
  StationTypes.StationGroup[],
  AxiosError
> = {
  queryKey: [
    'getStationGroupsByNames',
    defaultConfig.stationDefinition.services.getStationGroupsByNames.requestConfig
  ],
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

export const getStationGroupsQueryConfig = (stationGroups: string[], effectiveTime?: number) => {
  let data;
  if (effectiveTime) {
    data = {
      stationGroupNames: stationGroups,
      effectiveTime
    };
  } else {
    data = {
      stationGroupNames: stationGroups
    };
  }
  const config = createQueryConfig(stationGroupsQueryConfig, data);
  return config;
};

/**
 * Make a query for the station definitions, using the StationGroupNamesQueryConfig.
 * This is the easiest way to get the Station Definitions.
 */
export const useQueryStationGroups = (
  stationGroup: string,
  effectiveTime?: number
): QueryResult<StationTypes.StationGroup[], unknown> => {
  const config = getStationGroupsQueryConfig([stationGroup], effectiveTime);
  return useQuery<StationTypes.StationGroup[]>(config);
};
