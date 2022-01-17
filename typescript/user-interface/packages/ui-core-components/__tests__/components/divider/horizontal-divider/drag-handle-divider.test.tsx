import * as Enzyme from 'enzyme';
import * as React from 'react';

import { DragHandleDivider } from '../../../../src/ts/components/divider/horizontal-divider/drag-handle-divider';
import * as DragHandleDividerTypes from '../../../../src/ts/components/divider/horizontal-divider/types';

const props: DragHandleDividerTypes.DragHandleDividerProps = {
  handleHeight: 10,
  onDrag: jest.fn()
};
const { handleHeight } = props;

const wrapper = Enzyme.mount(<DragHandleDivider handleHeight={handleHeight} onDrag={jest.fn()} />);

describe('Drag Handle Divider', () => {
  it('to be defined', () => {
    expect(DragHandleDivider).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(
      <DragHandleDivider handleHeight={handleHeight} onDrag={jest.fn()} />
    );
    expect(shallow).toMatchSnapshot();
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });
});
