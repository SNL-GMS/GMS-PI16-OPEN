import { OperationalTimePeriodConfiguration } from '@gms/common-model/lib/ui-configuration/types';
import { StageInterval, Workflow } from '@gms/common-model/lib/workflow/types';
import { FORTY_FIVE_DAYS_IN_SECONDS } from '@gms/common-util';
import { PromptProps } from '@gms/ui-core-components/lib/components/dialog/types';
import { createStore } from '@gms/ui-state';
import * as Enzyme from 'enzyme';
import Immutable from 'immutable';
import { cloneDeep } from 'lodash';
import React from 'react';
import { act } from 'react-dom/test-utils';
import { QueryResult } from 'react-query';
import { Provider } from 'react-redux';

import {
  panWithHotKey,
  WorkflowPanel
} from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-panel';
import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';
import { reactQueryResult } from '../../../../__data__/test-util';
import { glContainer } from './gl-container';
import * as WorkflowDataTypes from './workflow-data-types';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const timeRange = { startTimeSecs: 1609500000, endTimeSecs: 1609506000 };
const MOCK_TIME = 1609506000000;
const MOCK_TIME_STR = '2021-01-01 13:00:00';

const testDate: Date = new Date(MOCK_TIME);

const mockDate: any = new Date(MOCK_TIME);
mockDate.now = () => MOCK_TIME;
mockDate.getMonth = () => testDate.getMonth();
mockDate.getFullYear = () => testDate.getFullYear();
mockDate.getDate = () => testDate.getDate();
mockDate.getMinutes = () => testDate.getMinutes();
Date.constructor = jest.fn(() => mockDate);
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
Date.now = jest.fn(() => MOCK_TIME);
Date.UTC = jest.fn(() => MOCK_TIME);

const store = createStore();
store.getState().analystWorkspaceState.workflowState.timeRange = timeRange;

let intervalQueryResultMap = Immutable.Map<string, StageInterval[]>();
intervalQueryResultMap = intervalQueryResultMap.set(WorkflowDataTypes.interactiveStage.name, [
  WorkflowDataTypes.interactiveAnalysisStageInterval
]);

const intervalQuery: QueryResult<Immutable.Map<string, StageInterval[]>, unknown> = cloneDeep(
  reactQueryResult
);
intervalQuery.data = intervalQueryResultMap;

const workflowQuery: QueryResult<Workflow, unknown> = cloneDeep(reactQueryResult);
workflowQuery.data = WorkflowDataTypes.workflow;

const operationalTimePeriodConfigurationQuery: QueryResult<
  OperationalTimePeriodConfiguration,
  any
> = cloneDeep(reactQueryResult);
operationalTimePeriodConfigurationQuery.data = {
  operationalPeriodStartSecs: FORTY_FIVE_DAYS_IN_SECONDS,
  operationalPeriodEndSecs: 0
};

jest.mock('~analyst-ui/client-interface/axios/queries/workflow-query', () => ({
  useWorkflowQuery: jest.fn(() => workflowQuery)
}));

const mockOpenInterval = jest.fn();
const mockCloseInterval = jest.fn();

jest.mock('../../../../../src/ts/components/analyst-ui/components/workflow/workflow-util', () => ({
  ...jest.requireActual(
    '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-util'
  ),
  useSetOpenInterval: jest.fn(() => {
    return mockOpenInterval;
  }),
  useCloseInterval: jest.fn(() => {
    return mockCloseInterval;
  })
}));

jest.mock(
  '~components/client-interface/axios/queries/processing-station-group-names-configuration-query',
  () => ({
    useProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
      data: { stationGroupNames: [WorkflowDataTypes.stationGroupName] }
    }))
  })
);

jest.mock(
  '~components/client-interface/axios/queries/processing-analyst-configuration-query',
  () => ({
    useProcessingAnalystConfigurationQuery: jest.fn(() => ({
      data: { maximumOpenAnythingDuration: 7200 }
    }))
  })
);

jest.mock('~components/client-interface', () => ({
  ...jest.requireActual('~components/client-interface'),
  Queries: {
    ...jest.requireActual('~components/client-interface').Queries,
    OperationalTimePeriodConfigurationQuery: {
      useOperationalTimePeriodConfigurationQuery: jest.fn(
        () => operationalTimePeriodConfigurationQuery
      )
    },
    StationGroupQuery: {
      useStationGroupQuery: jest.fn(() => ({
        data: [{ name: 'mockStationGroup' }, { name: 'mockStationGroup2' }]
      }))
    }
  }
}));

jest.mock('moment-precise-range-plugin', () => {
  return {};
});

jest.mock('moment', () => {
  // mock chain builder pattern
  const mMoment = {
    ...jest.requireActual('moment'),
    utc: jest.fn(() => mMoment),
    unix: jest.fn(() => mMoment),
    diff: jest.fn(() => 0),
    format: jest.fn(() => MOCK_TIME_STR),
    toDate: jest.fn(() => new Date(MOCK_TIME)),
    default: {
      default: jest.fn(() => mMoment),
      utc: jest.fn(() => mMoment)
    }
  };

  // mock the constructor and to modify instance methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn: any = jest.fn(() => {
    mMoment.format = jest.fn(() => MOCK_TIME_STR);
    mMoment.default = {
      unix: jest.fn(() => mMoment),
      utc: jest.fn(() => mMoment)
    };
    return mMoment;
  });

  // mock moment methods that depend on moment not on a moment instance
  fn.duration = jest.requireActual('moment').duration;
  fn.unix = () => ({
    subtract: () => mMoment,
    toDate: () => new Date(MOCK_TIME),
    utc: () => mMoment,
    diff: () => 0
  });
  fn.utc = jest.fn(() => mMoment);
  return fn;
});

const TIME_TO_WAIT_MS = 200;
const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};
describe('Workflow Panel', () => {
  it('is exported', () => {
    expect(WorkflowPanel).toBeDefined();
  });

  it('shallow mounts', () => {
    const shallow = Enzyme.shallow(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );

    expect(shallow).toMatchSnapshot();
    const workflowPanel = shallow.find('WorkflowPanel');
    expect(workflowPanel).toBeDefined();
  });

  it('full mounts', () => {
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );

    expect(component).toMatchSnapshot();
    const workflowPanel = component.find('WorkflowPanel');
    expect(workflowPanel).toBeDefined();
  });
  it('can handle panWithHotKey', () => {
    const stopProp = jest.fn();
    const eventWithShiftRight: any = {
      shiftKey: true,
      key: 'ArrowRight',
      stopPropagation: stopProp
    };
    const pan = jest.fn();
    panWithHotKey(eventWithShiftRight, pan);

    const eventRight: any = {
      shiftKey: false,
      key: 'ArrowRight',
      stopPropagation: stopProp
    };
    panWithHotKey(eventRight, pan);

    const eventWithShiftLeft: any = {
      shiftKey: true,
      key: 'ArrowLeft',
      stopPropagation: stopProp
    };
    panWithHotKey(eventWithShiftLeft, pan);

    const eventLeft: any = {
      shiftKey: false,
      key: 'ArrowLeft',
      stopPropagation: stopProp
    };
    panWithHotKey(eventLeft, pan);

    expect(pan).toHaveBeenCalledTimes(4);
    expect(stopProp).toHaveBeenCalledTimes(4);
    stopProp.mockClear();

    // Verify that the onKeyDown event calls panWithHotKey
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );

    component.find('div[className="workflow-panel"]').props().onKeyDown(eventLeft);
    expect(stopProp).toHaveBeenCalledTimes(1);
  });

  it('confirmation panel exists with discard and cancel buttons', () => {
    const realUseState = React.useState;
    jest.spyOn(React, 'useState').mockImplementationOnce(() => realUseState(true as unknown));

    const shallow = Enzyme.shallow(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );
    const confirmationDialogueDiscardButton = shallow
      .find('button')
      .find({ text: 'Discard changes' });
    expect(confirmationDialogueDiscardButton).toBeDefined();

    const confirmationDialogueCancelButton = shallow.find('button').find({ text: 'Cancel' });
    expect(confirmationDialogueCancelButton).toBeDefined();
  });

  it('confirmation panel closes and sets the interval for opening an interval', () => {
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );
    const confirmationPrompt = component.find('ModalPrompt[title="Warning"]');
    (confirmationPrompt.props() as PromptProps).actionCallback();
    expect(mockOpenInterval).toBeCalledWith(null);
    expect(component).toBeDefined();
  });

  it('confirmation panel closes and sets the interval for open anything', async () => {
    const spy = jest.spyOn(store, 'dispatch');
    mockOpenInterval.mockClear();
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );
    const openAnythingItem = component.find('button[data-cy="workflow-openAnythingItem"]');
    openAnythingItem.simulate('click');

    await waitForComponentToPaint(component);
    const openAnythingPrompt = component.find('ModalPrompt[title="Open Anything"]');
    (openAnythingPrompt.props() as PromptProps).actionCallback();
    await waitForComponentToPaint(component);

    await waitForComponentToPaint(component);
    const confirmationPrompt = component.find('ModalPrompt[title="Warning"]');
    (confirmationPrompt.props() as PromptProps).actionCallback();
    await waitForComponentToPaint(component);
    expect(component).toMatchSnapshot();
    expect(mockOpenInterval).toBeCalledTimes(0);
    expect(spy).toBeCalled();
  });

  it('showOpenAnything bypasses the confirmation prompt if no interval has been selected', async () => {
    const spy = jest.spyOn(store, 'dispatch');
    mockOpenInterval.mockClear();
    store.getState().analystWorkspaceState.workflowState.timeRange = null;

    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );

    await waitForComponentToPaint(component);
    const openAnythingItem = component.find('button[data-cy="workflow-openAnythingItem"]');
    openAnythingItem.simulate('click');

    await waitForComponentToPaint(component);
    const openAnythingPrompt = component.find('ModalPrompt[title="Open Anything"]');
    (openAnythingPrompt.props() as PromptProps).actionCallback();

    await waitForComponentToPaint(component);
    expect(mockOpenInterval).toBeCalledTimes(0);
    expect(spy).toBeCalled();
  });

  it('mouse events work', () => {
    const component = Enzyme.mount(
      <BaseDisplay glContainer={glContainer}>
        <Provider store={store}>
          <WorkflowPanel
            glContainer={glContainer}
            workflowIntervalQuery={intervalQuery}
            workflowQuery={workflowQuery}
            operationalTimePeriodConfigurationQuery={operationalTimePeriodConfigurationQuery}
            timeRange={timeRange}
          />
        </Provider>
      </BaseDisplay>
    );

    const mockEventFocus = jest.fn();
    const mockEventblur = jest.fn();

    const mockMouseEvent: any = {
      currentTarget: {
        blur: mockEventblur,
        focus: mockEventFocus
      }
    };
    component.find('div[className="workflow-panel"]').props().onMouseEnter(mockMouseEvent);
    expect(mockEventFocus).toHaveBeenCalled();

    component.find('div[className="workflow-panel"]').props().onMouseLeave(mockMouseEvent);
    expect(mockEventblur).toHaveBeenCalled();
  });
});
