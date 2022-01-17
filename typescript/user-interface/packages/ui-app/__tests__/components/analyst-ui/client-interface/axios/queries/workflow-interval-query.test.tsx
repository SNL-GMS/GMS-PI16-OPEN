import { CommonTypes, WorkflowTypes } from '@gms/common-model';
import { AxiosError } from 'axios';
import Immutable from 'immutable';
import { UseQueryObjectConfig } from 'react-query';

import {
  fetchWorkflowIntervals,
  getWorkflowIntervalQueryConfig,
  useWorkflowIntervalQuery,
  workflowIntervalQueryConfig
} from '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-interval-query';
import { queryCache } from '../../../../../../src/ts/components/client-interface/axios/queries/query-util';
import { expectQueryHookToMakeAxiosRequest } from '../../../../../utils/query-mutation-test-utils';

describe('Workflow Query', () => {
  const timeRange: CommonTypes.TimeRange = {
    startTimeSecs: 0,
    endTimeSecs: 100
  };
  describe('starts with', () => {
    it('a hook for accessing the workflow interval query defined', () => {
      expect(useWorkflowIntervalQuery).toBeDefined();
    });
    it('a query config defined', () => {
      expect(workflowIntervalQueryConfig).toBeDefined();
    });
    it('fetchWorkflow intervals defined', () => {
      expect(fetchWorkflowIntervals).toBeDefined();
    });

    it('getWorkflowIntervalQueryConfig defined', () => {
      expect(fetchWorkflowIntervals).toBeDefined();
    });
  });

  it('getWorkflowIntervalQueryConfig returns valid config', () => {
    const config: UseQueryObjectConfig<
      Immutable.Map<string, WorkflowTypes.StageInterval[]>,
      AxiosError
    > = getWorkflowIntervalQueryConfig([], timeRange);
    expect(config).toMatchSnapshot();
  });

  it('fetchWorkflow returns the expected result', async () => {
    const queryCacheMock = {
      fetchQuery: jest.fn()
    };
    Object.assign(queryCache, queryCacheMock);

    queryCacheMock.fetchQuery.mockReturnValueOnce('Query can be fetched');
    const result = await fetchWorkflowIntervals([], timeRange);

    expect(result).toEqual('Query can be fetched');
  });

  it('hook queries for workflow interval query', async () => {
    const useTestHook = () => useWorkflowIntervalQuery(['stageName1', 'stageName2'], timeRange);
    await expectQueryHookToMakeAxiosRequest(useTestHook);
    expect(true).toBeTruthy();
  });

  it('fails to fetch workflow, error thrown', async () => {
    expect.assertions(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err: any = new Error('Nope');
    const errWrapped: Error = new Error(err);
    const failQueryCacheMock = {
      fetchQuery: jest.fn(() => {
        throw err;
      })
    };
    Object.assign(queryCache, failQueryCacheMock);

    await fetchWorkflowIntervals([], timeRange).catch(e => {
      expect(e).toEqual(errWrapped);
    });
  });
});
