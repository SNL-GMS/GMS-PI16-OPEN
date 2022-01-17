/* eslint-disable react/jsx-props-no-spreading */
import { createStore } from '@gms/ui-state';
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { Provider } from 'react-redux';

import { WorkflowTableStageProps } from '../../../../../src/ts/components/analyst-ui/components/workflow/types';
import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import { WorkflowTableStage } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-table-stage';
import * as WorkFlowDataTypes from './workflow-data-types';

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
global.Date.now = jest.fn(() => MOCK_TIME);

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

describe('Workflow Table Stage', () => {
  it('is exported', () => {
    expect(WorkflowTableStage).toBeDefined();
  });

  const workflowTableStageProps: WorkflowTableStageProps = {
    stage: WorkFlowDataTypes.interactiveAnalysisStageInterval,
    isExpanded: false,
    subRowNames: []
  };

  const rowNames = ['row1', 'row2'];

  const workflowTableStageProps2: WorkflowTableStageProps = {
    stage: WorkFlowDataTypes.interactiveAnalysisStageInterval,
    isExpanded: false,
    subRowNames: rowNames
  };
  const workflowTableStageProps3: WorkflowTableStageProps = {
    stage: WorkFlowDataTypes.automaticProcessingStageInterval,
    isExpanded: false,
    subRowNames: []
  };

  const workflowTableStageProps4: WorkflowTableStageProps = {
    stage: WorkFlowDataTypes.automaticProcessingStageInterval,
    isExpanded: false,
    subRowNames: rowNames
  };

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
          <WorkflowTableStage {...workflowTableStageProps} />
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(component).toMatchSnapshot();
    const workflowTableStage: any = component.find('WorkflowTableStage').instance();
    expect(workflowTableStage).toBeDefined();
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
          <WorkflowTableStage {...workflowTableStageProps} />{' '}
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(shallow).toMatchSnapshot();
    const workflowTableStage: any = shallow.find('WorkflowTableStage');
    expect(workflowTableStage).toBeDefined();
  });

  it('Workflow Table Stage functions and clicks', async () => {
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
          <WorkflowTableStage {...workflowTableStageProps} />{' '}
        </WorkflowContext.Provider>
      </Provider>
    );

    expect(wrapper.props().isExpanded).toBeFalsy();

    wrapper.setProps({ isExpanded: true });

    await waitForComponentToPaint(wrapper);
    expect(wrapper.props().isExpanded).toBeTruthy();
  });

  it('mounts with automatic processing interval', () => {
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
          <WorkflowTableStage {...workflowTableStageProps3} />{' '}
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('Workflow Table Stage handles subRowNames', async () => {
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
          <WorkflowTableStage {...workflowTableStageProps2} />{' '}
        </WorkflowContext.Provider>
      </Provider>
    );

    wrapper.update();
    expect(wrapper.props().isExpanded).toBeFalsy();

    wrapper.setProps({ isExpanded: true });

    await waitForComponentToPaint(wrapper);
    expect(wrapper.props().isExpanded).toBeTruthy();

    wrapper.setProps(workflowTableStageProps3);
    await waitForComponentToPaint(wrapper);
    expect(wrapper.props().isExpanded).toBeFalsy();

    wrapper.setProps(workflowTableStageProps4);
    await waitForComponentToPaint(wrapper);
    expect(wrapper.props().isExpanded).toBeFalsy();
  });
});
