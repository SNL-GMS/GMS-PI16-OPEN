import { StationTypes } from '@gms/common-model';
import { toOSDTime } from '@gms/common-util';
import { QueryResult, useQuery } from 'react-query';

import { queryCache } from './query-util';
import { getStationGroupsQueryConfig } from './station-groups-definition-query';

/**
 * Asynchronous call to fetch data:
 *
 * @returns the station groups at the provided effective time
 */
export const fetchStationGroups = async (
  stationGroup: string[],
  effectiveTime: number
): Promise<StationTypes.StationGroup[]> => {
  const stationGroupsByNamesTimeQueryConfig = getStationGroupsQueryConfig(
    stationGroup,
    effectiveTime
  );

  return queryCache.fetchQuery<StationTypes.StationGroup[]>(stationGroupsByNamesTimeQueryConfig);
};

/**
 * Query for station groups.
 *
 * @param effectiveTimeUnixEpochSecs: A number that represents the effective Time in Unix Epoch Seconds (Date.now()/1000)
 */
export const useStationGroupQuery = (
  stationGroupNames: string[],
  effectiveTimeUnixEpochSecs: number
): QueryResult<StationTypes.Station[], unknown> => {
  return useQuery({
    queryKey: ['fetchStationGroups', toOSDTime(effectiveTimeUnixEpochSecs)],
    queryFn: async (): Promise<StationTypes.StationGroup[]> => {
      return fetchStationGroups(stationGroupNames, effectiveTimeUnixEpochSecs);
    },
    // Note: https://github.com/tannerlinsley/react-query/issues/1342 state that queryCache may not
    // adhere to the "staleTime" below and is fixed in the version 3.x of react-query
    queryConfig: {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      enabled: stationGroupNames && stationGroupNames.length > 0
    }
  });
};
