import {
  fetchWorkflow,
  useWorkflowQuery,
  workflowQueryConfig
} from '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-query';
import { queryCache } from '../../../../../../src/ts/components/client-interface/axios/queries/query-util';
import { expectQueryHookToMakeAxiosRequest } from '../../../../../utils/query-mutation-test-utils';

describe('Workflow Query', () => {
  describe('starts with', () => {
    it('a hook for accessing the workflow query defined', () => {
      expect(useWorkflowQuery).toBeDefined();
    });
    it('a query config defined', () => {
      expect(workflowQueryConfig).toBeDefined();
    });
    it('fetchWorkflow defined', () => {
      expect(fetchWorkflow).toBeDefined();
    });
  });

  it('fetchWorkflow returns the expected result', async () => {
    const queryCacheMock = {
      fetchQuery: jest.fn()
    };
    Object.assign(queryCache, queryCacheMock);

    queryCacheMock.fetchQuery.mockReturnValueOnce('Query can be fetched');
    const result = await fetchWorkflow();

    expect(result).toEqual('Query can be fetched');
  });

  it('hook queries for workflow query', async () => {
    const useTestHook = () => useWorkflowQuery();
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

    await fetchWorkflow().catch(e => {
      expect(e).toEqual(errWrapped);
    });
  });
});
