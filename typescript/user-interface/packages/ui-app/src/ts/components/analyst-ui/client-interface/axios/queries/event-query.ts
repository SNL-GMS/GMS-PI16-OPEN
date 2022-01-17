/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CommonTypes, EventTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { createQueryConfig, queryCache } from '~components/client-interface';

const eventRequestConfig = {
  url: 'placeholderUrl'
};

// TODO: uncomment when endpoint defined
// const eventRequestConfig = cloneDeep(
//   defaultConfig.Event.services.getEvents.requestConfig
// );

const dummyFunction = async (): Promise<any> => {
  return new Promise<any>(resolve => resolve([]));
};

/**
 * The Event query configuration.
 * Pass to react-query's useQuery
 */
export const eventQueryConfig: UseQueryObjectConfig<EventTypes.Event[], AxiosError> = {
  queryKey: ['event', eventRequestConfig],
  // TODO: Remove dummyFunction when real query is defined
  queryFn: dummyFunction,
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * creates a queryConfig for Event queries that may be provided to ReactQuery's
 * fetch/query functions.
 *
 * @param stationGroup a station group for which to query
 */
const createEventConfig = (timeRange: CommonTypes.TimeRange) =>
  createQueryConfig<EventTypes.Event[]>(eventQueryConfig, timeRange);

/**
 * Make a query for the events query, using the eventsQueryConfig.
 * This is the easiest way to get the events.
 */
export const useEventQuery = (
  timeRange: CommonTypes.TimeRange
): QueryResult<EventTypes.Event[], unknown> => {
  const updatedConfig = createEventConfig(timeRange);
  return useQuery<EventTypes.Event[]>(updatedConfig);
};

/**
 * Direct query for use when functional hook is not appropriate
 *
 * @param timeRange
 */
export const fetchEvents = async (
  timeRange: CommonTypes.TimeRange
): Promise<EventTypes.Event[]> => {
  const updatedConfig = createEventConfig(timeRange);
  try {
    return await queryCache.fetchQuery<EventTypes.Event[]>(updatedConfig);
  } catch (e) {
    throw new Error(e);
  }
};
