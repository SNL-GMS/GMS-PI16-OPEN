import { WorkflowTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import { QueryResult, useQuery, UseQueryObjectConfig } from 'react-query';

import { queryCache } from '~components/client-interface';
import { defaultConfig } from '~config/endpoint-configuration';

export interface WorkflowQueryProps {
  workflowQuery: QueryResult<WorkflowTypes.Workflow, unknown>;
}

/**
 * The Workflow query configuration.
 * Pass to react-query's useQuery
 */
export const workflowQueryConfig: UseQueryObjectConfig<WorkflowTypes.Workflow, AxiosError> = {
  queryKey: ['workflow', defaultConfig.workflowConfiguration.services.workflow.requestConfig],
  config: {
    staleTime: Infinity, // ms
    refetchOnWindowFocus: false
  }
};

/**
 * Make a query for the workflow query, using the workflowQueryConfig.
 * This is the easiest way to get the workflow.
 */
export const useWorkflowQuery = (): QueryResult<WorkflowTypes.Workflow, unknown> => {
  return useQuery<WorkflowTypes.Workflow>(workflowQueryConfig);
};

/**
 * Direct query for use when functional hook is not appropriate
 */
export const fetchWorkflow = async (): Promise<WorkflowTypes.Workflow> => {
  try {
    return await queryCache.fetchQuery<WorkflowTypes.Workflow>(workflowQueryConfig);
  } catch (e) {
    throw new Error(e);
  }
};
