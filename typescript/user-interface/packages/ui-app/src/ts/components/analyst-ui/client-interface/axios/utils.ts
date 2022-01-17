import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import { MILLISECONDS_IN_SECOND, toEpochSeconds } from '@gms/common-util';
import Immutable from 'immutable';
import moment from 'moment';

import { queryCache } from '~components/client-interface';

import { getWorkflowIntervalQueryConfig } from './queries/workflow-interval-query';

// TODO once our query key logic is cleaned up, will not need stageNames and timeRange
export const cleanUpWorkflow = (
  latestIntervalEndTime: number,
  operationalTimeDuration: number,
  stageNames: string[],
  timeRange: CommonTypes.TimeRange
): void => {
  const startTime = toEpochSeconds(
    moment((latestIntervalEndTime - operationalTimeDuration) * MILLISECONDS_IN_SECOND)
      .utc()
      .startOf('hour')
      .toISOString()
  );
  const { queryKey } = getWorkflowIntervalQueryConfig(stageNames, timeRange);
  let cachedWorkflowIntervalResultMap: Immutable.Map<
    string,
    WorkflowTypes.StageInterval[]
  > = queryCache.getQueryData(queryKey);
  // TODO maybe optimize with bailing once finding a valid endTime
  let foundStaleEntries = false;
  cachedWorkflowIntervalResultMap.forEach((entries, key) => {
    const newEntries = entries
      .map(entry => {
        if (entry.startTime < startTime) {
          foundStaleEntries = true;
          return undefined;
        }
        return entry;
      })
      .filter(entry => entry !== undefined);
    cachedWorkflowIntervalResultMap = cachedWorkflowIntervalResultMap.set(key, newEntries);
  });
  if (foundStaleEntries) {
    queryCache.setQueryData(queryKey, cachedWorkflowIntervalResultMap);
  }
};
