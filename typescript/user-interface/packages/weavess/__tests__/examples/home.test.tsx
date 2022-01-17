import React from 'react';

import { Home } from '../../src/ts/examples/home';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).alert = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).open = jest.fn();

it('renders a component', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper: any = Enzyme.mount(<Home />);
  expect(wrapper.render()).toMatchSnapshot();
});
