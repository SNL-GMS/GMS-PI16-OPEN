/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { YAxisProps } from '../../../../../../src/ts/components/waveform-display/components/axes/y-axis/types';
import { YAxis } from '../../../../../../src/ts/components/waveform-display/components/axes/y-axis/y-axis';
import { actAndWaitForComponentToPaint } from '../../../../../test-util/test-util';

const props: YAxisProps = {
  heightInPercentage: 100,
  minAmplitude: 0,
  maxAmplitude: 100,
  yAxisTicks: [0, 2, 4, 6, 8, 10]
};

const wrapper = Enzyme.mount(<YAxis {...props} />);
const instance: YAxis = wrapper.find(YAxis).instance() as YAxis;

describe('Weavess X Axis', () => {
  it('to be defined', () => {
    expect(YAxis).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<YAxis {...props} />);
    expect(shallow).toMatchSnapshot();

    const yAxis = new YAxis(props);
    const spy = jest.spyOn(yAxis, 'display');
    yAxis.display();
    expect(spy).toBeCalledTimes(1);
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('componentDidUpdate', () => {
    const spy = jest.spyOn(instance, 'componentDidUpdate');

    instance.componentDidUpdate();
    expect(spy).toBeCalledTimes(1);
  });

  it('componentDidCatch', () => {
    const spy = jest.spyOn(instance, 'componentDidCatch');
    instance.componentDidCatch(new Error('error'), { componentStack: undefined });
    expect(spy).toBeCalled();
  });

  it('try to display a negative', () => {
    const mean = Enzyme.mount(
      <YAxis {...props} yAxisTicks={undefined} minAmplitude={0} maxAmplitude={0.05} />
    );
    expect(mean).toMatchSnapshot();
  });

  it('updates when display is called', async () => {
    await actAndWaitForComponentToPaint(wrapper, () => {
      instance.display();
    });
    expect(wrapper).toMatchSnapshot();
  });
});
