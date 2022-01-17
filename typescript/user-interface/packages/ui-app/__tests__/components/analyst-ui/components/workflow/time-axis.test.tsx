import { ReactWrapper } from 'enzyme';
import React from 'react';

import {
  WorkflowTimeAxis,
  WorkflowTimeAxisProps
} from '../../../../../src/ts/components/analyst-ui/components/workflow/workflow-time-axis';

// set up window alert and open so we don't see errors
window.alert = jest.fn();
window.open = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Adapter = require('enzyme-adapter-react-16');

const mockWorkflowTimeAxisProps: WorkflowTimeAxisProps = {
  timeRange: {
    startTimeSecs: 3000,
    endTimeSecs: 3600
  }
};

describe('workflow time axis tests', () => {
  beforeEach(() => {
    Enzyme.configure({ adapter: new Adapter() });
  });

  // Not the most useful test because the d3 does not render
  // eslint-disable-next-line jest/no-done-callback
  it('renders a snapshot', (done: jest.DoneCallback) => {
    // eslint-disable-next-line react/jsx-props-no-spreading
    const wrapper: ReactWrapper = Enzyme.mount(<WorkflowTimeAxis {...mockWorkflowTimeAxisProps} />);

    setImmediate(() => {
      wrapper.update();
      expect(wrapper.find(WorkflowTimeAxis)).toMatchSnapshot('component');

      done();
    });
  });
});
