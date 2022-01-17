/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { NumericInput } from '../../../../src/ts/components/ui-widgets/numeric-input';
import * as NumericInputTypes from '../../../../src/ts/components/ui-widgets/numeric-input/types';
import { MinMax } from '../../../../src/ts/components/ui-widgets/toolbar/types';

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

const numericInputMinMax: MinMax = {
  min: 0,
  max: 100
};

const props: NumericInputTypes.NumericInputProps = {
  value: 0,
  tooltip: 'numeric input',
  widthPx: 150,
  disabled: false,
  minMax: numericInputMinMax,
  step: 1,
  requireEnterForOnChange: false,
  onChange: jest.fn()
};

const wrapper = Enzyme.mount(<NumericInput {...props} />);

describe('History List', () => {
  it('to be defined', () => {
    expect(NumericInput).toBeDefined();
  });

  it('History List shallow renders', () => {
    const shallow = Enzyme.shallow(<NumericInput {...props} />);
    expect(shallow).toMatchSnapshot();
  });

  it('History List renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('History List functions and clicks', async () => {
    // const onChangeMock = jest.fn();

    const wrapper3 = Enzyme.mount(
      <NumericInput
        // onChange={onChangeMock}
        {...props}
      />
    );
    const instance: NumericInput = wrapper3.find(NumericInput).instance() as NumericInput;

    expect(instance.state.intermediateValue).toBe(0);
    expect(instance.props.value).toEqual(0);

    const spy = jest.spyOn(instance, 'componentDidUpdate');
    const spy2 = jest.spyOn(instance, 'render');

    wrapper3.setProps({ value: 50 });
    await waitForComponentToPaint(wrapper3);
    expect(spy).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
    expect(instance.state.intermediateValue).toBe(50);
    expect(instance.props.value).toEqual(50);

    wrapper3.setProps({ value: 'apple' });
    await waitForComponentToPaint(wrapper3);
    expect(spy).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();

    wrapper3.simulate('change', { currentTarget: { name: 'value', value: 100 } });
    await waitForComponentToPaint(wrapper3);
    expect(spy).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();

    wrapper3.simulate('mouseEnter');
    await waitForComponentToPaint(wrapper3);
    expect(spy).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();

    wrapper3.setProps({ value: 75, requireEnterForOnChange: true });
    await waitForComponentToPaint(wrapper3);
    wrapper3.find('input').simulate('keydown', {
      target: { name: 'value', value: 75 },
      currentTarget: { name: 'value', value: 75 },
      key: 'Enter'
    });
    expect(spy).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
  });
});
