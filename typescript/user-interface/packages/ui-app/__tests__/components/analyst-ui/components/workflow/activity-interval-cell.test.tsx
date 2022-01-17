import { createStore } from '@gms/ui-state';
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import {
  ActivityIntervalCell,
  determineTextForCell,
  preventDefaultEvent
} from '../../../../../src/ts/components/analyst-ui/components/workflow/activity-interval-cell';
import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import * as WorkflowDataTypes from './workflow-data-types';

const TIME_TO_WAIT_MS = 200;
const store: any = createStore();

/**
 * Fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
 */
const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};

describe('Activity Interval Cell', () => {
  it('is exported', () => {
    expect(ActivityIntervalCell).toBeDefined();
  });

  it('matches snapshot', () => {
    const component = Enzyme.mount(
      <Provider store={store}>
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <ActivityIntervalCell activityInterval={WorkflowDataTypes.activityInterval} />
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });

  it('shallow mounts', () => {
    const shallow = Enzyme.shallow(
      <Provider store={store}>
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <ActivityIntervalCell activityInterval={WorkflowDataTypes.activityInterval} />
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(shallow).toMatchSnapshot();
  });

  it('can determine text for cell', () => {
    const text = determineTextForCell(WorkflowDataTypes.status, WorkflowDataTypes.analysts);
    expect(text).toBe('larry + 2');

    const text2 = determineTextForCell(
      WorkflowDataTypes.status,
      WorkflowDataTypes.analysts.slice(-1)
    );
    expect(text2).toBe('curly');

    const desiredAnalystItem = -2;
    const text3 = determineTextForCell(
      WorkflowDataTypes.status,
      WorkflowDataTypes.analysts.slice(desiredAnalystItem)
    );
    expect(text3).toBe('moe + 1');

    const text4 = determineTextForCell(
      WorkflowDataTypes.notStartedStatus,
      WorkflowDataTypes.analysts
    );
    expect(text4).toBe('');

    const text5 = determineTextForCell(
      WorkflowDataTypes.notCompleteStatus,
      WorkflowDataTypes.analysts
    );
    expect(text5).toBe('');

    const text6 = determineTextForCell(
      WorkflowDataTypes.completeStatus,
      WorkflowDataTypes.analysts
    );
    expect(text6).toBe('larry');

    const text7 = determineTextForCell(WorkflowDataTypes.completeStatus, []);
    expect(text7).toBe('');

    const text8 = determineTextForCell(WorkflowDataTypes.completeStatus, undefined);
    expect(text8).toBe('');
  });

  it('Activity Interval Cell functions and clicks', async () => {
    const wrapper = Enzyme.mount(
      <Provider store={store}>
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <ActivityIntervalCell activityInterval={WorkflowDataTypes.activityInterval} />
        </WorkflowContext.Provider>
      </Provider>
    );

    expect(wrapper.props().isSelected).toBeFalsy();

    wrapper.setProps({ isSelected: true });
    await waitForComponentToPaint(wrapper);
    expect(wrapper.props().isSelected).toBeTruthy();
  });
  it('can prevent default for context menu', () => {
    const event: any = {
      preventDefault: jest.fn(),
      openAnythingConfirmationPrompt: jest.fn(),
      closeConfirmationPrompt: jest.fn()
    };
    preventDefaultEvent(event);
    const spy = jest.spyOn(event, 'preventDefault');
    expect(spy).toHaveBeenCalled();
  });
});
