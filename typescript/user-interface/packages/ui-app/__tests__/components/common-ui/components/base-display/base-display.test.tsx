import * as React from 'react';

import { BaseDisplay } from '../../../../../src/ts/components/common-ui/components/base-display';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();
window.ResizeObserver = jest.fn(() => {
  return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
});
const globalAny: any = global;
globalAny.ResizeObserver = window.ResizeObserver;
globalAny.DOMRect = jest.fn(() => ({}));

// eslint-disable-next-line import/no-deprecated
const lodash = jest.requireActual('lodash');
lodash.uniqueId = () => '1';

describe('System Messages Display', () => {
  it('should be defined', () => {
    expect(BaseDisplay).toBeDefined();
  });
  const base: any = Enzyme.mount(
    <BaseDisplay
      glContainer={
        {
          widthPx: 150,
          heightPx: 150,
          on: jest.fn()
        } as any
      }
      className="mock-display"
    />
  );

  it('matches snapshot', () => {
    expect(base).toMatchSnapshot();
  });
});
