import { WorkflowTypes } from '@gms/common-model';
import { FORTY_FIVE_DAYS_IN_SECONDS } from '@gms/common-util/src/ts/util/time-util';
import { createStore } from '@gms/ui-state';
import React from 'react';
// import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { WorkflowToolbar } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-toolbar';
import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';
import { glContainer } from './gl-container';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

const MOCK_TIME = 1606818240000;
const MOCK_TIME_STR = '2020-12-01 10:24';

const mockDate: any = new Date(MOCK_TIME);
mockDate.now = () => MOCK_TIME;
Date.constructor = jest.fn(() => mockDate);
jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
Date.now = jest.fn(() => MOCK_TIME);
Date.UTC = jest.fn(() => MOCK_TIME);

jest.mock(
  '~components/client-interface/axios/queries/processing-analyst-configuration-query',
  () => ({
    useProcessingAnalystConfigurationQuery: jest.fn(() => ({
      data: { maximumOpenAnythingDuration: 7200 }
    }))
  })
);

jest.mock('moment-precise-range-plugin', () => {
  return {};
});

jest.mock('moment', () => {
  // mock chain builder pattern
  const mMoment = {
    ...jest.requireActual('moment'),
    utc: jest.fn(() => mMoment),
    format: jest.fn(() => MOCK_TIME_STR),
    default: {
      utc: jest.fn(() => mMoment)
    }
  };

  // mock the constructor and to modify instance methods
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fn: any = jest.fn(() => {
    mMoment.format = jest.fn(() => MOCK_TIME_STR);
    mMoment.default = {
      utc: jest.fn(() => mMoment)
    };
    return mMoment;
  });

  // mock moment methods that depend on moment not on a moment instance
  fn.duration = jest.requireActual('moment').duration;
  fn.unix = () => ({ utc: () => mMoment });
  fn.utc = jest.fn(() => mMoment);
  return fn;
});

jest.mock('~components/client-interface', () => ({
  ...jest.requireActual('~components/client-interface'),
  Queries: {
    ...jest.requireActual('~components/client-interface').Queries,
    OperationalTimePeriodConfigurationQuery: {
      useOperationalTimePeriodConfigurationQuery: jest.fn(() => ({
        data: {
          operationalPeriodStartSecs: FORTY_FIVE_DAYS_IN_SECONDS,
          operationalPeriodEndSecs: 0
        }
      }))
    },
    StationGroupQuery: {
      useStationGroupQuery: jest.fn(() => ({
        data: [{ name: 'mockStationGroup' }]
      }))
    }
  }
}));

jest.mock('~analyst-ui/client-interface/axios/queries/workflow-query', () => ({
  useWorkflowQuery: jest.fn(() => ({
    data: {
      stages: [
        {
          name: 'mockStage',
          mode: WorkflowTypes.StageMode.INTERACTIVE,
          activities: [{ stationGroup: { name: 'mockStationGroup' } }]
        },
        {
          name: 'mockStage2',
          mode: WorkflowTypes.StageMode.AUTOMATIC,
          activities: [{ stationGroup: { name: 'mockStationGroup2' } }]
        }
      ]
    }
  }))
}));

jest.mock(
  '~components/client-interface/axios/queries/processing-station-group-names-configuration-query',
  () => ({
    useProcessingStationGroupNamesConfigurationQuery: jest.fn(() => ({
      data: { stationGroupNames: ['mockStationGroup', 'mockStationGroup'] }
    }))
  })
);
/*
const TIME_TO_WAIT_MS = 200;
 const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
}; */

describe('Workflow Toolbar', () => {
  // const onOpenAnything = jest.fn();
  const onPan = jest.fn();

  const storeDefault = createStore();

  const store = createStore();
  store.getState().analystWorkspaceState.workflowState = {
    timeRange: {
      startTimeSecs: 0,
      endTimeSecs: 1000
    },
    openIntervalName: 'Al1',
    openActivityNames: ['Event Review'],
    stationGroup: {
      name: 'Station Group',
      effectiveAt: 0,
      description: ''
    },
    analysisMode: WorkflowTypes.AnalysisMode.SCAN
  };

  it('is exported', () => {
    expect(WorkflowToolbar).toBeDefined();
  });

  it('matches snapshot', () => {
    const component = Enzyme.mount(
      <Provider store={storeDefault}>
        <BaseDisplay glContainer={glContainer}>
          <WorkflowToolbar onPan={onPan} />
        </BaseDisplay>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });

  it('matches default value snapshot', () => {
    const defaultValueComponent = Enzyme.mount(
      <Provider store={store}>
        <BaseDisplay glContainer={glContainer}>
          <WorkflowToolbar onPan={onPan} />
        </BaseDisplay>
      </Provider>
    );
    expect(defaultValueComponent).toMatchSnapshot();
  });

  /* Disabled pending Date picker refactor and integration */
  // eslint-disable-next-line jest/no-commented-out-tests
  /* it(
    'handle buttons clicks',
    async () => {
      const component = Enzyme.mount(
        <Provider store={storeDefault}>
          <BaseDisplay glContainer={glContainer}>
            <WorkflowToolbar onPan={onPan} />
          </BaseDisplay>
        </Provider>
      );

      await waitForComponentToPaint(component);

      let buttons = component.find('button');

      const doubleLeftArrowItem = buttons.find({ 'data-cy': 'workflow-doubleLeftArrowItem' });
      expect(doubleLeftArrowItem.props().title).toMatchInlineSnapshot(
        `"Pan the workflow to the left by 7 days"`
      );
      doubleLeftArrowItem.simulate('click');
      expect(onPan).toHaveBeenCalledTimes(1);

      const singleLeftArrowItem = buttons.find({ 'data-cy': 'workflow-singleLeftArrowItem' });
      expect(singleLeftArrowItem.props().title).toMatchInlineSnapshot(
        `"Pan the workflow to the left by 1 day"`
      );
      singleLeftArrowItem.simulate('click');
      expect(onPan).toHaveBeenCalledTimes(2);

      const singleRightArrowItem = buttons.find({ 'data-cy': 'workflow-singleRightArrowItem' });
      expect(singleRightArrowItem.props().title).toMatchInlineSnapshot(
        `"Pan the workflow to the right by 1 day"`
      );
      singleRightArrowItem.simulate('click');
      expect(onPan).toHaveBeenCalledTimes(3);

      const doubleRightArrowItem = buttons.find({ 'data-cy': 'workflow-doubleRightArrowItem' });
      expect(doubleRightArrowItem.props().title).toMatchInlineSnapshot(
        `"Pan the workflow to the right by 7 days"`
      );
      doubleRightArrowItem.simulate('click');
      expect(onPan).toHaveBeenCalledTimes(4);

      const openAnythingItem = buttons.find({ 'data-cy': 'workflow-openAnythingItem' });
      expect(openAnythingItem.props().title).toMatchInlineSnapshot(`"Open anything"`);

      // opens up the `open anything dialog`
      openAnythingItem.simulate('click');
      expect(onOpenAnything).toHaveBeenCalledTimes(0);

      component.update();
      await waitForComponentToPaint(component);

      expect(component).toMatchSnapshot();

      buttons = component.find('button');

      const openAnythingDialogCancelButton = component
        .find('button')
        .find({ 'data-cy': 'modal-cancel-button' });
      expect(openAnythingDialogCancelButton.text()).toMatchInlineSnapshot(`"Cancel"`);
      // closes the `open anything dialog`
      openAnythingDialogCancelButton.simulate('click');
      expect(onOpenAnything).toHaveBeenCalledTimes(0);

      // opens up the `open anything dialog`
      openAnythingItem.simulate('click');
      expect(onOpenAnything).toHaveBeenCalledTimes(0);

      component.update();
    },
    TEN_SECONDS_MS
  ); */
});
