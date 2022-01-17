/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { CommonTypes, QcMaskTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { createQueryConfig, queryCache } from '~components/client-interface';

const qcMaskRequestConfig = {
  url: 'placeholderUrl'
};

// TODO: uncomment when endpoint defined
// const qcMaskRequestConfig = cloneDeep(
//   defaultConfig.QcMask.services.getQcMasks.requestConfig
// );

const dummyFunction = async (): Promise<any> => {
  return new Promise<any>(resolve => resolve([]));
};

/**
 * The QcMask query configuration.
 * Pass to react-query's useQuery
 */
export const qcMaskQueryConfig: UseQueryObjectConfig<QcMaskTypes.QcMask[], AxiosError> = {
  queryKey: ['qcMask', qcMaskRequestConfig],
  // TODO: Remove dummyFunction when real query is defined
  queryFn: dummyFunction,
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * creates a queryConfig for QcMask queries that may be provided to ReactQuery's
 * fetch/query functions.
 *
 * @param timeRange the time interval of the mask to be returned
 */
const createQcMaskConfig = (timeRange: CommonTypes.TimeRange) =>
  createQueryConfig<QcMaskTypes.QcMask[]>(qcMaskQueryConfig, timeRange);

/**
 * Make a query for the qcMask query, using the qcMaskQueryConfig.
 * This is the easiest way to get the qcMasks.
 */
export const useQcMaskQuery = (
  timeRange: CommonTypes.TimeRange
): QueryResult<QcMaskTypes.QcMask[], unknown> => {
  const updatedConfig = createQcMaskConfig(timeRange);
  return useQuery<QcMaskTypes.QcMask[]>(updatedConfig);
};

/**
 * Direct query for use when functional hook is not appropriate
 *
 * @param timeRange
 */
export const fetchQcMasks = async (
  timeRange: CommonTypes.TimeRange
): Promise<QcMaskTypes.QcMask[]> => {
  const updatedConfig = createQcMaskConfig(timeRange);
  try {
    return await queryCache.fetchQuery<QcMaskTypes.QcMask[]>(updatedConfig);
  } catch (e) {
    throw new Error(e);
  }
};
