import React from 'react';

import { BottomResizeHandle, ResizeHandleProps } from '../../../src/ts/components/resizer';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

// set up window alert and open so we don't see errors
(window as any).alert = jest.fn();
(window as any).open = jest.fn();

describe('BottomResizeHandle', () => {
  const props: ResizeHandleProps = {
    onResizeEnd: jest.fn(),
    handleMouseMove: jest.fn()
  };
  // eslint-disable-next-line react/jsx-props-no-spreading
  const mockBottomResizeHandle = Enzyme.shallow(<BottomResizeHandle {...props} />);
  it('is exported', () => {
    expect(BottomResizeHandle).toBeDefined();
  });
  it('will match the snapshot', () => {
    expect(mockBottomResizeHandle).toMatchSnapshot();
  });
});
