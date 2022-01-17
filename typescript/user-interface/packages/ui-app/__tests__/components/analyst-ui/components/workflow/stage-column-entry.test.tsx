import { createStore } from '@gms/ui-state';
import React from 'react';
import { Provider } from 'react-redux';

import { StageColumnEntry } from '../../../../../src/ts/components/analyst-ui/components/workflow/stage-column-entry';
import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import * as WorkflowDataTypes from './workflow-data-types';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

const store: any = createStore();

describe('Stage Column Entry', () => {
  it('is exported', () => {
    expect(StageColumnEntry).toBeDefined();
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
          <StageColumnEntry stageInterval={WorkflowDataTypes.interactiveAnalysisStageInterval} />{' '}
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });
});
