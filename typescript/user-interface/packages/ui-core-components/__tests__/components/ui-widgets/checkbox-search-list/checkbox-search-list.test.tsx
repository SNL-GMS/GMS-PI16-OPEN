/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { CheckboxSearchList } from '../../../../src/ts/components/ui-widgets/checkbox-search-list/checkbox-search-list';
import * as CheckboxSearchListTypes from '../../../../src/ts/components/ui-widgets/checkbox-search-list/types';

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

const checkboxItem1 = {
  id: '1',
  name: 'first',
  checked: true
};

const checkboxItem2 = {
  id: '2',
  name: 'second',
  checked: false
};

const checkboxItem3 = {
  id: '3',
  name: 'third',
  checked: false
};

const checkboxItems = [checkboxItem1, checkboxItem2, checkboxItem3];

const props: CheckboxSearchListTypes.CheckboxListProps = {
  items: checkboxItems,
  maxHeightPx: 300,
  onCheckboxChecked: jest.fn()
};

const wrapper = Enzyme.mount(<CheckboxSearchList {...props} />);

describe('CheckboxSearchList', () => {
  it('to be defined', () => {
    expect(CheckboxSearchList).toBeDefined();
  });

  it('CheckboxSearchList shallow renders', () => {
    const shallow = Enzyme.shallow(<CheckboxSearchList {...props} />);
    expect(shallow).toMatchSnapshot();
  });

  it('CheckboxSearchList renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('CheckboxSearchList functions and clicks', async () => {
    const mockOnCheckboxChecked = jest.fn();

    const wrapper3 = Enzyme.mount(
      <CheckboxSearchList
        items={checkboxItems}
        maxHeightPx={300}
        onCheckboxChecked={mockOnCheckboxChecked}
      />
    );

    const cbProps = wrapper3.props() as CheckboxSearchListTypes.CheckboxListProps;
    cbProps.onCheckboxChecked('3', true);
    await waitForComponentToPaint(wrapper3);

    wrapper3.find('.checkbox-search-list__search').simulate('change', { value: 'second' });
    wrapper3.setState({ currentFilter: 'second' });
    await waitForComponentToPaint(wrapper3);
    expect(wrapper3.state('currentFilter')).toEqual('second');

    wrapper3.setState({ currentFilter: '' });
    await waitForComponentToPaint(wrapper3);

    expect(mockOnCheckboxChecked).toHaveBeenCalledTimes(1);
  });

  it('CheckboxSearchList list item clicks', async () => {
    const mockOnCheckboxChecked = jest.fn();

    const wrapper4 = Enzyme.mount(
      <CheckboxSearchList
        items={checkboxItems}
        maxHeightPx={300}
        onCheckboxChecked={mockOnCheckboxChecked}
      />
    );

    const lastCB = wrapper4.find('.checkbox-search-list-item').last();
    const lastInput = lastCB.find('input');
    expect(lastCB).toBeDefined();
    expect(lastInput).toBeDefined();
    lastInput.simulate('change');
    await waitForComponentToPaint(wrapper4);
    expect(mockOnCheckboxChecked).toHaveBeenCalledTimes(1);
  });
});
