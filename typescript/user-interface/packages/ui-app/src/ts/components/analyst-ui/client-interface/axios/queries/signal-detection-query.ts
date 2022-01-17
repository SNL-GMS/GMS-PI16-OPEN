/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { SignalDetectionTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { createQueryConfig, queryCache } from '~components/client-interface';

// CONFIG
const signalDetectionRequestConfig = {
  url: 'placeholderUrl'
};

// TODO uncomment line when endpoint is defined
// defaultConfig.SignalDetection.services.getSignalDetections.requestConfig;

const dummyFunction = async (): Promise<any> => {
  return new Promise<any>(resolve => resolve([]));
};

/**
 * The SignalDetection query configuration.
 * Pass to react-query's useQuery
 */
export const signalDetectionQueryConfig: UseQueryObjectConfig<
  SignalDetectionTypes.SignalDetection[],
  AxiosError
> = {
  queryKey: ['signalDetections', signalDetectionRequestConfig],
  // TODO: Remove dummyFunction when real query is defined
  queryFn: dummyFunction,
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * creates a queryConfig for signal detection queries that may be provided to ReactQuery's
 * fetch/query functions.
 *
 * @param stationGroup a station group for which to query
 */
const createSignalDetectionConfig = (
  signalDetectionQueryArgs: SignalDetectionTypes.SignalDetectionsByStationQueryArgs
) =>
  createQueryConfig<SignalDetectionTypes.SignalDetection[]>(
    signalDetectionQueryConfig,
    signalDetectionQueryArgs
  );

/**
 * Make a query for the signal detection query, using the signalDetectionQueryConfig.
 * This is the easiest way to get the signal detections.
 */
export const useSignalDetectionQuery = (
  signalDetectionQueryArgs: SignalDetectionTypes.SignalDetectionsByStationQueryArgs
): QueryResult<SignalDetectionTypes.SignalDetection[], unknown> => {
  const updatedConfig = createSignalDetectionConfig(signalDetectionQueryArgs);
  return useQuery<SignalDetectionTypes.SignalDetection[]>(updatedConfig);
};

/**
 * Direct query for use when functional hook is not appropriate
 *
 * @param signalDetectionQueryArgs:SignalDetectionsByStationQueryArgs
 */
export const fetchSignalDetections = async (
  signalDetectionQueryArgs: SignalDetectionTypes.SignalDetectionsByStationQueryArgs
): Promise<SignalDetectionTypes.SignalDetection[]> => {
  const updatedConfig = createSignalDetectionConfig(signalDetectionQueryArgs);
  try {
    return await queryCache.fetchQuery<SignalDetectionTypes.SignalDetection[]>(updatedConfig);
  } catch (e) {
    throw new Error(e);
  }
};
