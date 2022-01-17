/* eslint-disable @typescript-eslint/no-explicit-any */
import { WaveformTypes } from '@gms/common-model';
import { WeavessTypes } from '@gms/weavess-core';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { QueryFunction, QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';
import { RpcProvider } from 'worker-rpc';

import { createQueryConfig, queryCache } from '~components/client-interface';
import { defaultConfig } from '~config/endpoint-configuration';
import { gmsColors, semanticColors } from '~scss-config/color-preferences';
import { WorkerOperations } from '~workers/waveform-worker/operations/operations';
import { WaveformStore } from '~workers/waveform-worker/worker-store/waveform-store';

// eslint-disable-next-line no-var, vars-on-top
declare var require;
// eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-webpack-loader-syntax, @typescript-eslint/no-require-imports, import/no-extraneous-dependencies
const WaveformWorker = require('worker-loader?inline&fallback=false!src/ts/workers/waveform-worker'); // eslint:disable-line

const worker = new WaveformWorker();
const workerRpc = new RpcProvider((message, transfer) => {
  worker.postMessage(message, transfer);
});
worker.onmessage = e => {
  workerRpc.dispatch(e.data);
};

const getChannelSegments = async (
  queryKey: string,
  requestConfig: AxiosRequestConfig,
  currentInterval: WeavessTypes.TimeRange
): Promise<WeavessTypes.ChannelSegment[]> =>
  workerRpc.rpc(WorkerOperations.FETCH_WAVEFORMS, {
    queryKey,
    originalDomain: currentInterval,
    requestConfig,
    gmsColors,
    semanticColors
  });

/**
 * Requests the Weavess formatted Float32Array position buffer data from the WaveformWorker
 * which will either calculate and return the buffer, or will return a cached version.
 *
 * @param id the id corresponding to this position buffer
 * @returns a promise for a Float32Array formatted for Weavess' consumption using the
 * position buffer format: x y x y x y...
 */
export const getPositionBuffer = async (
  id: string,
  startTime: number,
  endTime: number
): Promise<Float32Array> => {
  return workerRpc.rpc(WorkerOperations.GET_WAVEFORM, {
    id,
    startTime,
    endTime
  });
};

/**
 * Gets the boundaries for the channel segment. Makes a request to the WaveformWorker for
 * these boundaries, which will be calculated if they are not yet cached.
 *
 * @param channelName the name of the channel for which to get the boundaries
 * @returns the computed boundaries for the channel segment (min, max, etc)
 */
export const getBoundaries = async (
  channelName: string,
  channelSegment?: WeavessTypes.ChannelSegment,
  startTimeSecs?: number,
  endTimeSecs?: number
): Promise<WeavessTypes.ChannelSegmentBoundaries> =>
  workerRpc.rpc(WorkerOperations.GET_BOUNDARIES, {
    id: channelName,
    channelSegment,
    startTimeSecs,
    endTimeSecs
  });

/**
 * The Waveform Config.
 *
 * Creates a web worker using a worker RPC library. When the query is called, ReactQuery
 * sends a request to the worker, which receives the RPC request. The worker requests the
 * data using Axios, and then decompresses it (if message pack encoded) and converts it
 * to a typed array "PositionBuffer" using a util from WeavessCore.
 *
 * Pass to react-query's useQuery
 */
export const waveformQueryConfig: UseQueryObjectConfig<
  WeavessTypes.ChannelSegment[],
  AxiosError
> = {
  queryKey: [
    'waveforms',
    defaultConfig.waveformConfiguration.services.getWaveformConfiguration.requestConfig
  ],
  queryFn: getChannelSegments,
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * creates a queryConfig for waveform queries that may be provided to ReactQuery's
 * fetch/query functions.
 *
 * @param stationGroup a station group for which to query
 */
export const createWaveformConfig = (
  waveformQuery: WaveformTypes.WaveformQueryArgs,
  queryFn?: QueryFunction<WeavessTypes.ChannelSegment[]>
): UseQueryObjectConfig<WeavessTypes.ChannelSegment[], AxiosError> =>
  createQueryConfig<WeavessTypes.ChannelSegment[]>(waveformQueryConfig, waveformQuery, queryFn);

/**
 * Make a query for the waveform query, using the waveformQueryConfig.
 * This is the easiest way to get the Waveforms.
 */
export const useWaveformQuery = (
  waveformQuery: WaveformTypes.WaveformQueryArgs,
  currentInterval: WeavessTypes.TimeRange
): QueryResult<WeavessTypes.ChannelSegment[], unknown> => {
  const updatedQueryFn = async (
    queryKey: string,
    requestConfig: AxiosRequestConfig
  ): Promise<WeavessTypes.ChannelSegment[]> =>
    getChannelSegments(queryKey, requestConfig, currentInterval);
  const updatedConfig = createWaveformConfig(waveformQuery, updatedQueryFn);
  return useQuery<WeavessTypes.ChannelSegment[]>(updatedConfig);
};

/**
 * Direct query for use when functional hook is not appropriate
 *
 * @param waveformQuery:WaveformQueryArgs
 */
export const fetchWaveforms = async (
  waveformQuery: WaveformTypes.WaveformQueryArgs,
  currentInterval: WeavessTypes.TimeRange
): Promise<WeavessTypes.ChannelSegment[]> => {
  const updatedQueryFn = async (
    queryKey: string,
    requestConfig: AxiosRequestConfig
  ): Promise<WeavessTypes.ChannelSegment[]> =>
    getChannelSegments(queryKey, requestConfig, currentInterval);
  const updatedConfig = createWaveformConfig(waveformQuery, updatedQueryFn);
  try {
    return await queryCache.fetchQuery<WeavessTypes.ChannelSegment[]>(updatedConfig);
  } catch (e) {
    throw new Error(e);
  }
};

/**
 * Clear all waveforms from the React Query and waveform store caches.
 */
export const clearWaveformCaches = (): void => {
  // Clear waveforms from React Query cache
  queryCache.removeQueries('waveforms');
  // Clear waveform store
  WaveformStore.cleanup();
};
