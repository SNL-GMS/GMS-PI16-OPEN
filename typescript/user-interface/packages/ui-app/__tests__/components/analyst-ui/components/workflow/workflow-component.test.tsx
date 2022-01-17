import React from 'react';

import {
  WorkflowComponent,
  WorkflowPanelOrNonIdealState
} from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-component';
import { glContainer } from './gl-container';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

describe('Workflow Component', () => {
  it('is exported', () => {
    expect(WorkflowComponent).toBeDefined();
    expect(WorkflowPanelOrNonIdealState).toBeDefined();
  });

  it('matches snapshot', () => {
    const component = Enzyme.mount(<WorkflowComponent glContainer={glContainer} />);
    expect(component).toMatchSnapshot();
  });
});
