import React from 'react';

import { WeavessFlatLineExample } from '../../src/ts/examples/example-flat-line';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).alert = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).open = jest.fn();

window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

// TODO correct test rendering issues (console output errors)
it('renders a component', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper: any = Enzyme.mount(<WeavessFlatLineExample />);
  expect(wrapper.render()).toMatchSnapshot();
});
