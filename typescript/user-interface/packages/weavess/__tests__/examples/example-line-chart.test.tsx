import React from 'react';

import { WeavessLineChartExample } from '../../src/ts/examples/example-line-chart';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).alert = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).open = jest.fn();

// TODO correct test rendering issues (console output errors)
it('renders a component', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper: any = Enzyme.mount(<WeavessLineChartExample />);
  expect(wrapper.render()).toMatchSnapshot();
});
