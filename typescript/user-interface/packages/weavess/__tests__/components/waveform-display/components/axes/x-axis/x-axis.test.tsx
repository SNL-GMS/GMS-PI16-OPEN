/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { XAxisProps } from '../../../../../../src/ts/components/waveform-display/components/axes/x-axis/types';
import {
  tickFormatter,
  XAxis
} from '../../../../../../src/ts/components/waveform-display/components/axes/x-axis/x-axis';

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

const props: XAxisProps = {
  startTimeSecs: 100,
  endTimeSecs: 400,
  label: 'x axis',
  labelWidthPx: 20,
  scrollbarWidthPx: 10,
  borderTop: true,
  getViewRange: jest.fn(() => [0, 300])
};

const wrapper = Enzyme.mount(<XAxis {...props} />);
const instance: XAxis = wrapper.find(XAxis).instance() as XAxis;

describe('Weavess X Axis', () => {
  it('to be defined', () => {
    expect(XAxis).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<XAxis {...props} />);
    expect(shallow).toMatchSnapshot();

    expect(Enzyme.shallow(<XAxis {...props} borderTop={false} />)).toMatchSnapshot();
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

  it('tickFormatter', () => {
    expect(tickFormatter(new Date('Jan 1, 2021 07:01:00.00 GMT'))).toEqual('07:01:00.000');
  });
});
