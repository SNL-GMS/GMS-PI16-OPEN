import React from 'react';

import { App } from '../../src/ts/examples/app';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).alert = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).open = jest.fn();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const wrapper: any = Enzyme.mount(<App />);

it('renders a component', () => {
  expect(wrapper.render()).toMatchSnapshot();
});
