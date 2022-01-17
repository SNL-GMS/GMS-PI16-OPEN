/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ChannelTypes, StationTypes } from '@gms/common-model';
import { AxiosError, AxiosResponse } from 'axios';
import cloneDeep from 'lodash/cloneDeep';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultConfig } from '~config/endpoint-configuration';

import { defaultQuery } from './query-util';

// CONFIG
/**
 * The station definitions.
 * Pass to react-query's useQuery
 */
export const stationsQueryConfig: UseQueryObjectConfig<StationTypes.Station[], AxiosError> = {
  queryKey: ['getStations', defaultConfig.stationDefinition.services.getStations.requestConfig],
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * Get a config that can be used for ReactQuery queries for stationsByNames Query
 *
 * @param stationNames - List of station names
 * @param effectiveTime - String representing the effectiveTime
 */
export function handleUseStationsQueryResponse(
  response: AxiosResponse<StationTypes.Station[]>
): StationTypes.Station[] {
  const stations: StationTypes.Station[] = cloneDeep(response.data);

  stations.forEach((station, i) => {
    const relPos = new Map<string, ChannelTypes.RelativePosition>();
    Object.keys(station.relativePositionsByChannel).forEach(key => {
      relPos.set(key, station.relativePositionsByChannel[key]);
    });
    response.data[i].relativePositionsByChannel = relPos;
  });
  return response.data;
}

/**
 * Get a config that can be used for ReactQuery queries for stationsByNames Query with fully populated channel faceting
 *
 * @param stationNames - List of station names
 * @param effectiveTime - String representing the effectiveTime
 */
export const getStationsWithChannelsQueryConfig = (
  stationNames: string[],
  effectiveTime: string
) => {
  const requestConfigClone = cloneDeep(
    defaultConfig.stationDefinition.services.getStations.requestConfig
  );
  requestConfigClone.data = JSON.stringify({
    facetingDefinition: {
      populated: true,
      classType: 'Station',
      facetingDefinitions: {
        channels: {
          classType: 'Channel',
          populated: false,
          facetingDefinitions: {}
        },
        channelGroups: {
          classType: 'ChannelGroup',
          populated: true,
          facetingDefinitions: {
            channels: {
              classType: 'Channel',
              populated: true,
              facetingDefinitions: {}
            }
          }
        }
      }
    },
    stationNames,
    effectiveTime
  });
  return {
    queryKey: ['getStations', requestConfigClone],
    queryFn: defaultQuery(handleUseStationsQueryResponse),
    config: {
      staleTime: Infinity, // ms
      refetchOnWindowFocus: false
    }
  };
};

/**
 * Get a config that can be used for ReactQuery queries for stationsByNamesTimeQuery
 *
 * @param stationNames - List of station names
 * @param effectiveTime - String representing the effectiveTime
 */
export const getStationsQueryConfig = (stationNames: string[], effectiveTime: number) => {
  const requestConfigClone = cloneDeep(
    defaultConfig.stationDefinition.services.getStations.requestConfig
  );
  requestConfigClone.data = {
    stationNames,
    effectiveTime
  };

  return {
    queryKey: ['getStations', requestConfigClone],
    config: {
      staleTime: Infinity, // ms
      refetchOnWindowFocus: false
    }
  };
};

/**
 * Make a query for the station definition at a given time, using the StationsByNames Config.
 */
export const useStationsQuery = (
  stationNames: string[],
  effectiveTime: string
): QueryResult<StationTypes.Station[], unknown> => {
  const config = getStationsWithChannelsQueryConfig(stationNames, effectiveTime);

  return useQuery<StationTypes.Station[]>(config);
};
