import React from 'react';

import { ResizeContainer, Resizer } from '../../../src/ts/components/resizer';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('Resizer', () => {
  const mockResizer = Enzyme.mount(
    <ResizeContainer>
      <Resizer />
    </ResizeContainer>
  );
  it('is exported', () => {
    expect(Resizer).toBeDefined();
  });
  it('should match snap', () => {
    expect(mockResizer).toMatchSnapshot();
  });
});
