import { ConfigurationTypes, StationTypes } from '@gms/common-model';
import { toOSDTime } from '@gms/common-util';
import flatMap from 'lodash/flatMap';
import uniq from 'lodash/uniq';
import memoizeOne from 'memoize-one';
import { QueryResult, useQuery } from 'react-query';

import { processingAnalystConfigurationQueryConfig } from './processing-analyst-configuration-query';
import { useProcessingStationGroupNamesConfigurationQuery } from './processing-station-group-names-configuration-query';
import { queryCache } from './query-util';
import { getStationGroupsQueryConfig } from './station-groups-definition-query';
import { getStationsQueryConfig } from './stations-definition-query';

/**
 * We use this so that the list returned is referentially stable if the list is empty.
 */
const emptyStationGroupList = [];

/**
 * Get the default station group for interactive analysis.
 *
 * @returns the name of the default station group
 */
export async function fetchDefaultInteractiveAnalysisStationGroup(): Promise<string> {
  const analystConfiguration = await queryCache.fetchQuery<
    ConfigurationTypes.ProcessingAnalystConfiguration
  >(processingAnalystConfigurationQueryConfig);
  return analystConfiguration?.defaultInteractiveAnalysisStationGroup;
}

/**
 * Get the stations belonging to the given station group.
 *
 * @param stationGroups the station group whose stations to fetch
 * @param effectiveTime the time for which to query the station group
 * @returns a unique list of stations that belong to the provided station group at a given time.
 */
export async function fetchStationGroupStations(
  stationGroups: string[],
  effectiveTime: number
): Promise<StationTypes.Station[]> {
  const stationGroupsClean = stationGroups.filter(sg => !!sg);
  if (!stationGroupsClean || stationGroupsClean?.length < 1) {
    return emptyStationGroupList;
  }
  const stationGroupsByNamesTimeQueryConfig = getStationGroupsQueryConfig(
    stationGroupsClean,
    effectiveTime
  );

  const stationGroupObjs = await queryCache.fetchQuery<StationTypes.StationGroup[]>(
    stationGroupsByNamesTimeQueryConfig
  );

  if (!stationGroupObjs) {
    return emptyStationGroupList;
  }
  const stationNames = uniq(flatMap(stationGroupObjs?.map(x => x.stations.map(y => y.name))));

  const stationsByNamesTimeConfig = getStationsQueryConfig(stationNames, effectiveTime);
  const stationsResult = await queryCache.fetchQuery<StationTypes.Station[]>(
    stationsByNamesTimeConfig
  );
  return stationsResult;
}

/**
 * Asynchronous call to fetch three pieces of data:
 * 1) fetch analyst configuration,
 * 2) fetch stations in default station group
 * 3) fetch metadata for all stations in that station group.
 *
 * @returns all station definitions for the default station group at the provided effective time
 */
// TODO Remove the memoization once we update to ReactQuery v3, when the infinite stale cache property is respected.
export const fetchDefaultStationGroupStations = memoizeOne(
  async function actuallyFetchDefaultStationGroupStations(
    effectiveTime: number
  ): Promise<StationTypes.Station[]> {
    return fetchStationGroupStations(
      [await fetchDefaultInteractiveAnalysisStationGroup()],
      effectiveTime
    );
  }
);

/**
 * Query for all stations and their corresponding metadata using the default station group. This also
 * updates the cache. This makes three side effect calls, namely:
 * 1) fetch analyst configuration,
 * 2) fetch stations in default station group,
 * 3) fetch metadata for all stations in that station group.
 *
 * @param effectiveTimeUnixEpochSecs: A number that represents the effective Time in Unix Epoch Seconds (Date.now()/1000)
 */
export const useDefaultStationGroupStationQuery = (
  effectiveTimeUnixEpochSecs: number
): QueryResult<StationTypes.Station[], unknown> => {
  return useQuery(
    ['fetchDefaultStationGroupStations', toOSDTime(effectiveTimeUnixEpochSecs)],
    async (): Promise<StationTypes.Station[]> => {
      return fetchDefaultStationGroupStations(effectiveTimeUnixEpochSecs);
    },
    {
      staleTime: Infinity,
      refetchOnWindowFocus: false
    }
  );
};

/**
 * Get the stations for a given station group.
 *
 * @param stationGroup the station group to query. If nullish, query the default station group
 * @param effectiveTimeUnixEpochSecs
 * @returns a query result for the provided station group, or the default station group if the station group provided is falsy.
 */
export const useStationGroupStationQuery = (
  stationGroup: string,
  effectiveTimeUnixEpochSecs: number
): QueryResult<StationTypes.Station[], unknown> => {
  return useQuery(
    ['fetchStationGroupStations', stationGroup, toOSDTime(effectiveTimeUnixEpochSecs)],
    async (): Promise<StationTypes.Station[]> => {
      return fetchStationGroupStations(
        // If stationGroup is nullish, use the default station group
        [stationGroup || (await fetchDefaultInteractiveAnalysisStationGroup())],
        effectiveTimeUnixEpochSecs
      );
    },
    {
      staleTime: Infinity,
      refetchOnWindowFocus: false
    }
  );
};

/**
 * Get all stations.
 *
 * @param effectiveTimeUnixEpochSecs
 * @returns a query result for the provided station group, or the default station group if the station group provided is falsy.
 */
export const useAllStationsQuery = (
  effectiveTimeUnixEpochSecs: number
): QueryResult<StationTypes.Station[], unknown> => {
  const stationGroupNamesQuery = useProcessingStationGroupNamesConfigurationQuery();
  return useQuery(
    ['getAllStations', toOSDTime(effectiveTimeUnixEpochSecs)],
    async (): Promise<StationTypes.Station[]> => {
      return fetchStationGroupStations(
        stationGroupNamesQuery?.data?.stationGroupNames,
        effectiveTimeUnixEpochSecs
      );
    },
    {
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      enabled: stationGroupNamesQuery?.data && (effectiveTimeUnixEpochSecs ?? false)
    }
  );
};
