import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import Immutable from 'immutable';
import { QueryKey, QueryResult } from 'react-query';

import { WorkflowIntervalSubscription } from '../subscriptions';
import {
  fetchWorkflowIntervals,
  getWorkflowIntervalQueryConfig,
  useWorkflowIntervalQuery
} from './workflow-interval-query';
import { fetchWorkflow, useWorkflowQuery } from './workflow-query';

const startIntervalSubscription = (queryKey: QueryKey): void => {
  WorkflowIntervalSubscription.subscribeWorkflowInterval(queryKey);
};

export const fetchWorkflowData = async (
  timeRange: CommonTypes.TimeRange
): Promise<{
  workflow: WorkflowTypes.Workflow;
  stageIntervals: Immutable.Map<string, WorkflowTypes.StageInterval[]>;
}> => {
  const workflow: WorkflowTypes.Workflow = await fetchWorkflow();

  const stageNames: string[] = workflow?.stages?.map(stage => stage.name) ?? [];

  const stageIntervals: Immutable.Map<
    string,
    WorkflowTypes.StageInterval[]
  > = await fetchWorkflowIntervals(stageNames, timeRange);
  const workflowIntervalConfig = getWorkflowIntervalQueryConfig(stageNames, timeRange);
  startIntervalSubscription(workflowIntervalConfig.queryKey);

  WorkflowIntervalSubscription.cacheInitializedCallBack();

  return { workflow, stageIntervals };
};

export const useWorkflowData = (
  timeRange: CommonTypes.TimeRange
): {
  workflowQuery: QueryResult<WorkflowTypes.Workflow, unknown>;
  workflowIntervalQuery: QueryResult<Immutable.Map<string, WorkflowTypes.StageInterval[]>, unknown>;
} => {
  const workflowQuery = useWorkflowQuery();

  const stageNames: string[] = workflowQuery?.data?.stages?.map(stage => stage.name) ?? [];

  if (workflowQuery.isSuccess) {
    const workflowIntervalConfig = getWorkflowIntervalQueryConfig(stageNames, timeRange);
    startIntervalSubscription(workflowIntervalConfig.queryKey);
  }

  const workflowIntervalQuery = useWorkflowIntervalQuery(stageNames, timeRange);

  if (workflowIntervalQuery.isSuccess) {
    WorkflowIntervalSubscription.cacheInitializedCallBack();
  }

  return { workflowQuery, workflowIntervalQuery };
};
