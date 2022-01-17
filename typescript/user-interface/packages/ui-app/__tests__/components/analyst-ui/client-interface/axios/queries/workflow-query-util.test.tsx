import { CommonTypes } from '@gms/common-model';

import {
  fetchWorkflowData,
  useWorkflowData
} from '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-query-util';
import { workflow } from '../../../../../__data__/workflow-data';

jest.mock(
  '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-query-util',
  () => {
    const original = jest.requireActual(
      '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-query-util'
    );
    return {
      ...original,
      startIntervalSubscription: jest.fn()
    };
  }
);

jest.mock(
  '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-query',
  () => {
    const original = jest.requireActual(
      '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-query'
    );
    return {
      ...original,
      useWorkflowQuery: jest.fn(() => {
        return { data: workflow, isSuccess: true };
      }),
      fetchWorkflow: jest.fn(() => {
        return workflow;
      })
    };
  }
);

jest.mock(
  '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-interval-query',
  () => {
    const original = jest.requireActual(
      '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/workflow-interval-query'
    );
    return {
      ...original,
      useWorkflowIntervalQuery: jest.fn(() => {
        return { isSuccess: true, data: new Map() };
      }),
      fetchWorkflowIntervals: jest.fn(() => {
        return new Map();
      }),
      getWorkflowIntervalQueryConfig: jest.fn(() => {
        return {
          queryKey: 'blah'
        };
      })
    };
  }
);

describe('Workflow Query Util', () => {
  const timeRange: CommonTypes.TimeRange = {
    startTimeSecs: 0,
    endTimeSecs: 100
  };

  describe('starts with', () => {
    it('a hook for accessing the workflow interval query defined', () => {
      expect(fetchWorkflowData).toBeDefined();
    });
  });

  it('useWorkflowData returns the expected result', () => {
    const result = useWorkflowData(timeRange);
    expect(result.workflowQuery).toMatchSnapshot();
    expect(result.workflowIntervalQuery).toMatchSnapshot();
  });

  it('fetchWorkflowData returns the expected result', async () => {
    const result = await fetchWorkflowData(timeRange);
    expect(result.workflow).toMatchSnapshot();
    expect(result.stageIntervals).toMatchSnapshot();
  });
});
