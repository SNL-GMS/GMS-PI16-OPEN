import { createStore } from '@gms/ui-state';
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { SequenceIntervalCell } from '../../../../../src/ts/components/analyst-ui/components/workflow/sequence-interval-cell';
import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import { isStageIntervalPercentBar } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-util';
import * as WorkflowDataTypes from './workflow-data-types';

const store: any = createStore();

describe('Sequence Interval Cell', () => {
  it('is exported', () => {
    expect(SequenceIntervalCell).toBeDefined();
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
          <SequenceIntervalCell
            stageInterval={WorkflowDataTypes.automaticProcessingStageInterval}
          />
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
          <SequenceIntervalCell
            stageInterval={WorkflowDataTypes.automaticProcessingStageInterval}
          />
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(shallow).toMatchSnapshot();
  });

  it('can determine cell percent bar', () => {
    const interactiveStageInterval = isStageIntervalPercentBar(
      WorkflowDataTypes.interactiveAnalysisStageInterval
    );
    expect(interactiveStageInterval).toBeFalsy();

    const automaticStageInterval = isStageIntervalPercentBar(
      WorkflowDataTypes.automaticProcessingStageInterval
    );
    expect(automaticStageInterval).toBeTruthy();
  });

  it('checking on context menu for automated interval', () => {
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
          <SequenceIntervalCell
            stageInterval={WorkflowDataTypes.automaticProcessingStageInterval}
          />
        </WorkflowContext.Provider>
      </Provider>
    );

    component.setProps({ onContextMenu: jest.fn() });
    const seqIntItem = component.find('PercentBar');
    seqIntItem.simulate('click');
    const sequenceIntervalItem = component.find('div').first();
    const spy = jest.spyOn(sequenceIntervalItem.props(), 'onContextMenu');
    sequenceIntervalItem.simulate('click', { metaKey: true });
    expect(spy).toHaveBeenCalledTimes(0);
    const cMenu = component.find('IntervalContextMenu').first();
    expect(cMenu).toBeDefined();
    component.setProps({ stageInterval: WorkflowDataTypes.stageIntervalAuto });
    component.update();
    expect(component.props().stageInterval.stageMode).toBe(WorkflowDataTypes.automaticStageMode);
  });
});
