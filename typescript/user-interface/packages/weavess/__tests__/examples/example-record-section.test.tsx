import React from 'react';

import { RecordSectionExample } from '../../src/ts/examples/example-record-section';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).alert = jest.fn();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).open = jest.fn();

it('renders a component', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper: any = Enzyme.shallow(<RecordSectionExample />);
  expect(wrapper.render()).toMatchSnapshot();
});
