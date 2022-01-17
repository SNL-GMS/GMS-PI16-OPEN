import { TimeRange } from '@gms/common-model/lib/common/types';
import { OperationalTimePeriodConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import { StageInterval, Workflow } from '@gms/common-model/lib/workflow/types';
import { WithNonIdealStates } from '@gms/ui-core-components';
import { createStore } from '@gms/ui-state';
import { cloneDeep } from 'apollo-utilities';
import Immutable from 'immutable';
import React from 'react';
import { QueryResult } from 'react-query';
import { Provider } from 'react-redux';

import {
  workflowIntervalQueryNonIdealStates,
  workflowQueryNonIdealStates
} from '../../../../../src/ts/components/analyst-ui/components/workflow/non-ideal-states';
import { WorkflowPanelProps } from '../../../../../src/ts/components/analyst-ui/components/workflow/types';
import { WorkflowPanel } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-panel';
import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';
import { reactQueryResult } from '../../../../__data__/test-util';
import { glContainer } from './gl-container';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

const store = createStore();

const intervalQuery: QueryResult<Immutable.Map<string, StageInterval[]>, unknown> = cloneDeep(
  reactQueryResult
);

const workflowQuery: QueryResult<Workflow, unknown> = cloneDeep(reactQueryResult);
const operationalTimePeriodConfigurationQuery: QueryResult<
  OperationalTimePeriodConfiguration,
  any
> = cloneDeep(reactQueryResult);
const timeRange: TimeRange = {
  startTimeSecs: 1000,
  endTimeSecs: 2000
};
describe('workflow non-ideal-states', () => {
  it('workflow query exists', () => {
    expect(workflowQueryNonIdealStates).toBeDefined();
  });

  it('workflow query error matches snapshot', () => {
    const NonIdealElement = WithNonIdealStates<WorkflowPanelProps>(
      [...workflowQueryNonIdealStates],
      WorkflowPanel
    );
    workflowQuery.isError = true;
    workflowQuery.isLoading = false;
    intervalQuery.isError = false;
    intervalQuery.isLoading = false;
    operationalTimePeriodConfigurationQuery.isLoading = false;
    operationalTimePeriodConfigurationQuery.isError = false;
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <NonIdealElement
            workflowQuery={workflowQuery}
            workflowIntervalQuery={intervalQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );
    expect(component).toMatchSnapshot();
  });

  it('workflow query loading matches snapshot', () => {
    const NonIdealElement = WithNonIdealStates<WorkflowPanelProps>(
      [...workflowQueryNonIdealStates],
      WorkflowPanel
    );
    workflowQuery.isError = false;
    workflowQuery.isLoading = true;
    intervalQuery.isError = false;
    intervalQuery.isLoading = false;
    operationalTimePeriodConfigurationQuery.isLoading = false;
    operationalTimePeriodConfigurationQuery.isError = false;
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <NonIdealElement
            workflowQuery={workflowQuery}
            workflowIntervalQuery={intervalQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );
    expect(component).toMatchSnapshot();
  });

  it('workflow interval query empty matches snapshot', () => {
    const NonIdealElement = WithNonIdealStates<WorkflowPanelProps>(
      [...workflowIntervalQueryNonIdealStates],
      WorkflowPanel
    );
    workflowQuery.isError = false;
    workflowQuery.isLoading = false;
    intervalQuery.isError = false;
    intervalQuery.isLoading = false;
    intervalQuery.data = undefined;
    operationalTimePeriodConfigurationQuery.isLoading = false;
    operationalTimePeriodConfigurationQuery.isError = false;
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <NonIdealElement
            workflowQuery={workflowQuery}
            workflowIntervalQuery={intervalQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );
    expect(component).toMatchSnapshot();
  });

  it('workflow interval query error matches snapshot', () => {
    const NonIdealElement = WithNonIdealStates<WorkflowPanelProps>(
      [...workflowIntervalQueryNonIdealStates],
      WorkflowPanel
    );
    workflowQuery.isError = false;
    workflowQuery.isLoading = false;
    intervalQuery.isError = true;
    intervalQuery.isLoading = false;
    operationalTimePeriodConfigurationQuery.isLoading = false;
    operationalTimePeriodConfigurationQuery.isError = false;
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <NonIdealElement
            workflowQuery={workflowQuery}
            workflowIntervalQuery={intervalQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );
    expect(component).toMatchSnapshot();
  });

  it('workflow interval query loading matches snapshot', () => {
    const NonIdealElement = WithNonIdealStates<WorkflowPanelProps>(
      [...workflowIntervalQueryNonIdealStates],
      WorkflowPanel
    );
    workflowQuery.isError = false;
    workflowQuery.isLoading = false;
    intervalQuery.isError = false;
    intervalQuery.isLoading = true;
    operationalTimePeriodConfigurationQuery.isLoading = false;
    operationalTimePeriodConfigurationQuery.isError = false;
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <NonIdealElement
            workflowQuery={workflowQuery}
            workflowIntervalQuery={intervalQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );
    expect(component).toMatchSnapshot();
  });

  it('workflow interval query exists', () => {
    expect(workflowIntervalQueryNonIdealStates).toBeDefined();
  });

  it('workflow interval query matches snapshot', () => {
    expect(workflowIntervalQueryNonIdealStates).toBeDefined();
  });
});
