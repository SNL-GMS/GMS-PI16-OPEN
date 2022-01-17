import Immutable from 'immutable';
import React from 'react';

import { WorkflowTable } from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-table';
import { workflow } from '../../../../__data__/workflow-data';

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

describe('Workflow Table', () => {
  it('is exported', () => {
    expect(WorkflowTable).toBeDefined();
  });

  it('matches snapshot', () => {
    const component = Enzyme.mount(
      <WorkflowTable
        timeRange={{
          startTimeSecs: 0,
          endTimeSecs: 360000
        }}
        stageIntervals={Immutable.Map()}
        workflow={workflow}
        onScroll={jest.fn()}
      />
    );
    expect(component).toMatchSnapshot();
  });
});
