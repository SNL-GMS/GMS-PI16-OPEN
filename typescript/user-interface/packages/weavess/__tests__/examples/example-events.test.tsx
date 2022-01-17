import React from 'react';

import { EventsExample } from '../../src/ts/examples/example-events';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

jest.mock('lodash/uniqueId', () => {
  const id = 1;
  // eslint-disable-next-line no-plusplus
  return () => id;
});

// set up window alert and open so we don't see errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).alert = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).open = jest.fn();

// TODO correct test rendering issues (console output errors)
it('renders a component', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper: any = Enzyme.mount(<EventsExample />);
  expect(wrapper.render()).toMatchSnapshot();
});
