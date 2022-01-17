import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import Immutable from 'immutable';
import cloneDeep from 'lodash/cloneDeep';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { defaultQuery, queryCache } from '~components/client-interface';
import { defaultConfig } from '~config/endpoint-configuration';

export interface WorkflowIntervalQueryProps {
  workflowIntervalQuery: QueryResult<Immutable.Map<string, WorkflowTypes.StageInterval[]>, unknown>;
}

const workflowIntervalRequestConfig = cloneDeep(
  defaultConfig.workflowConfiguration.services.stageIntervalsByIdAndTime.requestConfig
);

/**
 * The Workflow interval query configuration.
 * Pass to react-query's useQuery
 */
export const workflowIntervalQueryConfig: UseQueryObjectConfig<
  Map<string, WorkflowTypes.StageInterval[]>,
  AxiosError
> = {
  queryKey: ['workflow-interval', workflowIntervalRequestConfig],
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * A custom Axios Response Transformer that converts the data into a Map.
 *
 * @param response The response data
 * @param headers The response headers
 *
 * @return the transformed data from the configured response transformer
 */
const axiosMapResponseConvertor = (response: any): Immutable.Map<string, unknown> => {
  let map = Immutable.Map<string, unknown>();
  // eslint-disable-next-line no-restricted-syntax
  for (const [key, value] of Object.entries(response.data)) {
    // eslint-disable-next-line no-console
    map = map.set(key, value);
  }
  return map;
};

/**
 * Get a config that can be used for ReactQuery queries for WorkflowInterval query
 *
 * @param stageNames - List of Stage names
 */
export const getWorkflowIntervalQueryConfig = (
  stageNames: string[],
  timeRange: CommonTypes.TimeRange
): UseQueryObjectConfig<Immutable.Map<string, WorkflowTypes.StageInterval[]>, unknown> => {
  workflowIntervalRequestConfig.data = {
    stageIds: stageNames.map(name => ({ name })),
    startTime: timeRange?.startTimeSecs,
    endTime: timeRange?.endTimeSecs
  };

  return {
    queryKey: ['getWorkflowIntervals', workflowIntervalRequestConfig],
    queryFn: defaultQuery(axiosMapResponseConvertor),
    config: {
      staleTime: Infinity, // ms
      refetchOnWindowFocus: false,
      // enable the query only when the data parameters are validated
      enabled:
        timeRange?.startTimeSecs !== undefined &&
        timeRange?.endTimeSecs !== undefined &&
        timeRange?.startTimeSecs <= timeRange?.endTimeSecs &&
        stageNames?.length > 0
    }
  };
};

/**
 * Make a query for the workflow query, using the workflowQueryConfig.
 * This is the easiest way to get the workflow.
 */
export const useWorkflowIntervalQuery = (
  stageNames: string[],
  timeRange: CommonTypes.TimeRange
): QueryResult<Immutable.Map<string, WorkflowTypes.StageInterval[]>, unknown> => {
  const workflowIntervalConfig = getWorkflowIntervalQueryConfig(stageNames, timeRange);
  return useQuery<Immutable.Map<string, WorkflowTypes.StageInterval[]>>(workflowIntervalConfig);
};

/**
 * Direct query for use when functional hook is not appropriate
 */
export const fetchWorkflowIntervals = async (
  stageNames: string[],
  timeRange: CommonTypes.TimeRange
): Promise<Immutable.Map<string, WorkflowTypes.StageInterval[]>> => {
  try {
    const workflowIntervalConfig = getWorkflowIntervalQueryConfig(stageNames, timeRange);
    const intervalMap = await queryCache.fetchQuery<
      Immutable.Map<string, WorkflowTypes.StageInterval[]>
    >(workflowIntervalConfig);
    return intervalMap;
  } catch (e) {
    throw new Error(e);
  }
};
