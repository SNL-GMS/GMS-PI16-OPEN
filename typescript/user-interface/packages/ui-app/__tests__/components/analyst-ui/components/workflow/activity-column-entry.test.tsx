/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { createStore } from '@gms/ui-state';
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';

import { ActivityColumnEntry } from '../../../../../src/ts/components/analyst-ui/components/workflow/activity-column-entry';
import { ActivityColumnEntryProps } from '../../../../../src/ts/components/analyst-ui/components/workflow/types';
import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import * as WorkflowDataTypes from './workflow-data-types';

const store: any = createStore();

describe('Activity Column Entry', () => {
  it('is exported', () => {
    expect(ActivityColumnEntry).toBeDefined();
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
          <ActivityColumnEntry activityInterval={WorkflowDataTypes.activityInterval} />
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(component).toMatchSnapshot();
  });

  const props: ActivityColumnEntryProps = {
    activityInterval: WorkflowDataTypes.activityInterval
  };

  it('Activity Column Entry shallow renders', () => {
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
          <ActivityColumnEntry {...props} />{' '}
        </WorkflowContext.Provider>
      </Provider>
    );
    expect(shallow).toMatchSnapshot();
  });
});
