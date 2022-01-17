import React from 'react';

import { FilterableOptionListExample } from '../../src/ts/examples/filterable-option-list-example';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

it('renders a component', () => {
  const wrapper: any = Enzyme.mount(<FilterableOptionListExample />);
  expect(wrapper.render()).toMatchSnapshot();
});
