import { H1 } from '@blueprintjs/core';
import * as React from 'react';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Adapter = require('enzyme-adapter-react-16');

Enzyme.configure({ adapter: new Adapter() });

describe('Test should run', () => {
  describe('Test Environment is available', () => {
    describe('enzyme should be available', () => {
      test('render a label', () => {
        // eslint-disable-next-line jsx-a11y/label-has-associated-control
        const wrapper = Enzyme.shallow(<label>Hello Jest!</label>);
        expect(wrapper).toMatchSnapshot();
      });
      test('render a div', () => {
        const wrapper = Enzyme.shallow(<div>Hello Jest!</div>);
        expect(wrapper).toMatchSnapshot();
      });
      test('render an h1', () => {
        const wrapper = Enzyme.shallow(<H1>Hello Jest!</H1>);
        expect(wrapper).toMatchSnapshot();
      });
    });
  });
});
