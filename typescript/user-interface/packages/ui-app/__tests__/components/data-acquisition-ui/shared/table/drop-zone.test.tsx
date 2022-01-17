import React from 'react';

import {
  DropZone,
  DropZoneProps
} from '../../../../../src/ts/components/data-acquisition-ui/shared/table/drop-zone';

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const Enzyme = require('enzyme');

jest.mock('@gms/ui-util', () => ({
  ...jest.requireActual('@gms/ui-util'),
  dragEventIsOfType: jest.fn(() => true)
}));

describe('Drop Zone', () => {
  const dropZoneProps: DropZoneProps<string[]> = {
    className: 'test',
    onDrop: jest.fn()
  };

  // eslint-disable-next-line react/jsx-props-no-spreading
  const wrapper = Enzyme.mount(<DropZone<string[]> {...dropZoneProps} />);
  it('is defined', () => {
    expect(wrapper).toBeDefined();
  });

  it('can handle cellDrop', () => {
    const dragEvent = React.createElement('drag');
    const spy = jest.spyOn(wrapper.find(DropZone).instance(), 'cellDrop');
    wrapper.find(DropZone).instance().cellDrop(dragEvent);
    expect(spy).toHaveBeenCalled();
  });

  it('can handle cellDragOver', () => {
    const dragEvent: any = {
      nativeEvent: {
        stopPropagation: jest.fn(),
        preventDefault: jest.fn()
      }
    };
    const spy = jest.spyOn(wrapper.find(DropZone).instance(), 'cellDragOver');
    wrapper.find(DropZone).instance().cellDragOver(dragEvent);
    expect(spy).toHaveBeenCalled();
  });
});
