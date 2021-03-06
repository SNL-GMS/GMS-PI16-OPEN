import React from 'react';

import { ResizeContainer } from '../../../src/ts/components/resizer';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('ResizeContainer', () => {
  const mockResizerContainer = Enzyme.shallow(
    <ResizeContainer>
      <div />
    </ResizeContainer>
  );
  it('is exported', () => {
    expect(ResizeContainer).toBeDefined();
  });
  it('will match its snapshot', () => {
    expect(mockResizerContainer).toMatchSnapshot();
  });
});
