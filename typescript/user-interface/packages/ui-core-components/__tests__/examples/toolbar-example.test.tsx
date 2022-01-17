import React from 'react';

import { ToolbarExample } from '../../src/ts/examples/toolbar-example';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

it('renders a component', () => {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  Date.now = jest.fn().mockReturnValue(1575410988600);
  const wrapper: any = Enzyme.mount(<ToolbarExample />);
  expect(wrapper.render()).toMatchSnapshot();
});
