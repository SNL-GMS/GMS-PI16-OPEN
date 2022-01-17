/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { CollapseButton } from '../../../src/ts/components/collapse/collapse-button';
import * as CollapseButtonTypes from '../../../src/ts/components/collapse/types';

const TIME_TO_WAIT_MS = 200;

/**
 * Fixes React warning that "An update to Component inside a test was not wrapped in act(...)."
 */
const waitForComponentToPaint = async (wrapper: any): Promise<void> => {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, TIME_TO_WAIT_MS));
    wrapper.update();
  });
};

const props: CollapseButtonTypes.CollapseButtonProps = {
  buttonText: 'collapse-button',
  isLoading: false,
  isCollapsed: false,
  onClick: jest.fn()
};

const wrapper = Enzyme.mount(<CollapseButton {...props} />);

describe('CollapseButton', () => {
  it('to be defined', () => {
    expect(CollapseButton).toBeDefined();
  });

  it('CollapseButton shallow renders', () => {
    const shallow = Enzyme.shallow(<CollapseButton {...props} />);
    expect(shallow).toMatchSnapshot();
  });

  it('CollapseButton renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('CollapseButton functions and clicks', async () => {
    const mockOnClick = jest.fn();

    const wrapper3 = Enzyme.mount(
      <CollapseButton
        buttonText="collapse-button"
        isLoading={false}
        isCollapsed
        onClick={mockOnClick}
      />
    );

    const cProps = wrapper3.props() as CollapseButtonTypes.CollapseButtonProps;

    cProps.onClick(false);
    await waitForComponentToPaint(wrapper3);

    wrapper3.simulate('click');
    await waitForComponentToPaint(wrapper3);
    expect(wrapper3.prop('isCollapsed')).toEqual(true);

    expect(mockOnClick).toHaveBeenCalledTimes(2);
  });

  it('CollapseButton item clicks', async () => {
    const mockOnClick = jest.fn();

    const wrapper4 = Enzyme.mount(
      <CollapseButton
        // buttonText={'my button'}
        buttonText={viz => (viz ? 'my button' : 'my hidden button')}
        isLoading={false}
        isCollapsed={false}
        onClick={mockOnClick}
      />
    );

    await waitForComponentToPaint(wrapper4);

    const lastCB = wrapper4.find('.collapse-button--open');
    const lastCollapse = lastCB.find('.collapse-button__target--open');
    expect(lastCB).toBeDefined();
    expect(lastCollapse).toBeDefined();
    wrapper4.simulate('click');
    await waitForComponentToPaint(wrapper4);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
