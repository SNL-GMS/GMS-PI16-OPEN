/* eslint-disable react/jsx-props-no-spreading */
import { createStore } from '@gms/ui-state';
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { WorkflowRowProps } from '../../../../../src/ts/components/analyst-ui/components/workflow/types';
import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import { WorkflowRow } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-row';
import * as WorkflowDataTypes from './workflow-data-types';

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

const store: any = createStore();

describe('Workflow Row', () => {
  it('is exported', () => {
    expect(WorkflowRow).toBeDefined();
  });

  const workflowRowProps: WorkflowRowProps = {
    stageIntervals: [WorkflowDataTypes.interactiveAnalysisStageInterval],
    subRowNames: []
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
          <WorkflowRow {...workflowRowProps} />
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(component).toMatchSnapshot();
    const workflowRow: any = component.find('WorkflowRow').instance();
    expect(workflowRow).toBeDefined();
  });

  it('shallow mounts', () => {
    const shallow = Enzyme.shallow(
      <Provider store={store}>
        <WorkflowRow {...workflowRowProps} />
      </Provider>
    );
    expect(shallow).toMatchSnapshot();
    const workflowRow: any = shallow.find('WorkflowRow');
    expect(workflowRow).toBeDefined();
  });
});
