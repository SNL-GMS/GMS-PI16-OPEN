/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { IconNames } from '@blueprintjs/icons';
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import {
  PopoverButton,
  PopoverTypes
} from '../../../../src/ts/components/ui-widgets/popover-button';

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

const props: PopoverTypes.PopoverProps = {
  label: 'my label',
  popupContent: (
    <div>
      <p>Pop Up Content</p>
    </div>
  ),
  renderAsMenuItem: false,
  disabled: false,
  tooltip: 'my tool tip',
  cyData: 'my-test-popover-button',
  widthPx: 150,
  onlyShowIcon: false,
  icon: IconNames.AIRPLANE,
  onPopoverDismissed: jest.fn(),
  onClick: jest.fn()
};

const wrapper = Enzyme.mount(<PopoverButton {...props} />);

describe('PopoverButton', () => {
  it('to be defined', () => {
    expect(PopoverButton).toBeDefined();
  });

  it('PopoverButton shallow renders', () => {
    const shallow = Enzyme.shallow(<PopoverButton {...props} />);
    expect(shallow).toMatchSnapshot();
  });

  it('PopoverButton renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('PopoverButton props and state', () => {
    const mockOnPopoverDismissed = jest.fn();
    const mockOnClick = jest.fn();

    const wrapper3 = Enzyme.mount(
      <PopoverButton
        label="my label"
        popupContent={
          <div>
            <p>Pop Up Content</p>
          </div>
        }
        renderAsMenuItem={false}
        disabled={false}
        tooltip="my tool tip"
        cyData="my-test-popover-button"
        widthPx={150}
        onlyShowIcon={false}
        icon={IconNames.AIRPLANE}
        onPopoverDismissed={mockOnPopoverDismissed}
        onClick={mockOnClick}
      />
    );

    const pbProps = wrapper3.props() as PopoverTypes.PopoverProps;
    expect(pbProps.disabled).toBe(false);

    const instance: PopoverButton = wrapper3.instance() as PopoverButton;
    const spy = jest.spyOn(instance, 'isExpanded');
    expect(spy).toHaveBeenCalledTimes(0);
    const ie = instance.isExpanded();
    expect(ie).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);

    const spy2 = jest.spyOn(instance, 'togglePopover');
    expect(spy2).toHaveBeenCalledTimes(0);
    instance.togglePopover();
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(wrapper3.state('isExpanded')).toBe(true);
    instance.togglePopover();
    expect(spy2).toHaveBeenCalledTimes(2);
    expect(wrapper3.state('isExpanded')).toBe(false);

    expect(mockOnClick).toHaveBeenCalledTimes(0);
    expect(mockOnPopoverDismissed).toHaveBeenCalledTimes(1);
  });

  it('PopoverButton props and state menu item', () => {
    const mockOnPopoverDismissed = jest.fn();
    const mockOnClick = jest.fn();

    const wrapper3 = Enzyme.mount(
      <PopoverButton
        label="my label"
        popupContent={
          <div>
            <p>Pop Up Content</p>
          </div>
        }
        renderAsMenuItem
        disabled={false}
        tooltip="my tool tip"
        cyData="my-test-popover-button"
        widthPx={150}
        onlyShowIcon={false}
        icon={IconNames.AIRPLANE}
        onPopoverDismissed={mockOnPopoverDismissed}
        onClick={mockOnClick}
      />
    );

    expect(wrapper3).toMatchSnapshot();

    const pbProps = wrapper3.props() as PopoverTypes.PopoverProps;
    expect(pbProps.disabled).toBe(false);

    const instance: PopoverButton = wrapper3.instance() as PopoverButton;
    const spy = jest.spyOn(instance, 'isExpanded');
    expect(spy).toHaveBeenCalledTimes(0);
    const ie = instance.isExpanded();
    expect(ie).toBe(false);
    expect(spy).toHaveBeenCalledTimes(1);

    const spy2 = jest.spyOn(instance, 'togglePopover');
    expect(spy2).toHaveBeenCalledTimes(0);
    instance.togglePopover();
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(wrapper3.state('isExpanded')).toBe(true);
    instance.togglePopover();
    expect(spy2).toHaveBeenCalledTimes(2);
    expect(wrapper3.state('isExpanded')).toBe(false);

    // eslint-disable-next-line
    wrapper3.find('.bp3-menu-item').simulate('click');

    expect(mockOnClick).toHaveBeenCalledTimes(0);
    expect(mockOnPopoverDismissed).toHaveBeenCalledTimes(1);
  });

  it('PopoverButton item clicks', async () => {
    const mockOnPopoverDismissed = jest.fn();
    const mockOnClick = jest.fn();

    const wrapper4 = Enzyme.mount(
      <PopoverButton
        label="my label"
        popupContent={
          <div>
            <p>Pop Up Content</p>
          </div>
        }
        renderAsMenuItem={false}
        disabled={false}
        tooltip="my tool tip"
        cyData="my-test-popover-button"
        widthPx={150}
        onlyShowIcon
        icon={IconNames.AIRPLANE}
        onPopoverDismissed={mockOnPopoverDismissed}
        onClick={mockOnClick}
      />
    );

    await waitForComponentToPaint(wrapper4);

    const lastPB = wrapper4.find('.toolbar-button--icon-only').first();
    const lastPBIcon = wrapper4.find('icon');
    expect(lastPB).toBeDefined();
    expect(lastPBIcon).toBeDefined();
    lastPB.simulate('click');
    await waitForComponentToPaint(wrapper4);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
});
