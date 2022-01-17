/* eslint-disable react/jsx-props-no-spreading */
import { WorkflowTypes } from '@gms/common-model';
import { secondsToString } from '@gms/common-util';
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { WorkflowContext } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-context';
import {
  getActiveAnalysts,
  getStatus,
  Tooltip,
  TooltipPanel
} from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-tooltip';
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

describe('Workflow Tooltip', () => {
  it('is exported', () => {
    expect(TooltipPanel).toBeDefined();
    expect(getStatus).toBeDefined();
    expect(getActiveAnalysts).toBeDefined();
    expect(Tooltip).toBeDefined();
  });

  it('can get active analysts', () => {
    expect(getActiveAnalysts(undefined)).toMatchInlineSnapshot(`undefined`);

    expect(
      getActiveAnalysts(WorkFlowDataTypes.interactiveAnalysisStageInterval)
    ).toMatchInlineSnapshot(`undefined`);

    expect(getActiveAnalysts(WorkFlowDataTypes.activityInterval)).toMatchInlineSnapshot(
      `"larry, moe, curly"`
    );
  });

  it('can get status', () => {
    expect(getStatus(undefined, undefined)).toMatchInlineSnapshot(`undefined`);

    expect(
      getStatus(WorkFlowDataTypes.automaticProcessingStageInterval, undefined)
    ).toMatchInlineSnapshot(`"In Progress"`);

    expect(getStatus(WorkFlowDataTypes.activityInterval, undefined)).toMatchInlineSnapshot(
      `"In Progress"`
    );

    expect(
      getStatus(WorkFlowDataTypes.automaticProcessingStageInterval, WorkFlowDataTypes.workflow)
    ).toMatchInlineSnapshot(`"In Progress (undefined)"`);

    expect(
      getStatus(WorkFlowDataTypes.activityInterval, WorkFlowDataTypes.workflow)
    ).toMatchInlineSnapshot(`"In Progress"`);
  });

  it('matches tooltip panel snapshot', () => {
    expect(
      Enzyme.mount(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <TooltipPanel
            status={undefined}
            activeAnalysts={undefined}
            lastModified={undefined}
            isStale={false}
          />
        </WorkflowContext.Provider>
      )
    ).toMatchSnapshot();

    expect(
      Enzyme.mount(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <TooltipPanel
            status={WorkflowTypes.IntervalStatus.IN_PROGRESS}
            activeAnalysts="analyst 1, analyst 2"
            lastModified={secondsToString(0)}
            isStale={false}
          />
        </WorkflowContext.Provider>
      )
    ).toMatchSnapshot();
  });

  it('matches tooltip snapshot', () => {
    expect(
      Enzyme.mount(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <Tooltip interval={WorkFlowDataTypes.activityInterval} />
        </WorkflowContext.Provider>
      )
    ).toMatchSnapshot();

    expect(
      Enzyme.mount(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <Tooltip interval={WorkFlowDataTypes.automaticProcessingStageInterval}>
            <div>content</div>
          </Tooltip>
        </WorkflowContext.Provider>
      )
    ).toMatchSnapshot();
  });

  it('can handle undefined interval with tooltip', () => {
    expect(
      Enzyme.mount(
        <WorkflowContext.Provider
          value={{
            staleStartTime: 1,
            allActivitiesOpenForSelectedInterval: false,
            openConfirmationPrompt: jest.fn(),
            openAnythingConfirmationPrompt: jest.fn(),
            closeConfirmationPrompt: jest.fn()
          }}
        >
          <Tooltip interval={undefined} />{' '}
        </WorkflowContext.Provider>
      )
    ).toMatchSnapshot();
  });
});
