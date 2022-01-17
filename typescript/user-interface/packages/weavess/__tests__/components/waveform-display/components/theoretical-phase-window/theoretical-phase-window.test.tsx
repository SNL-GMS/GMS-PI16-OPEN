/* eslint-disable react/jsx-props-no-spreading */
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { TheoreticalPhaseWindow } from '../../../../../src/ts/components/waveform-display/components/theoretical-phase-window/theoretical-phase-window';
import { TheoreticalPhaseWindowProps } from '../../../../../src/ts/components/waveform-display/components/theoretical-phase-window/types';

const props: TheoreticalPhaseWindowProps = {
  id: 'my-id',
  color: 'ff0000',
  label: 'my label',
  left: 0,
  right: 4
};

const wrapper = Enzyme.mount(<TheoreticalPhaseWindow {...props} />);
const instance: any = wrapper.find(TheoreticalPhaseWindow).instance();

describe('Weavess Empty Renderer', () => {
  it('to be defined', () => {
    expect(TheoreticalPhaseWindow).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<TheoreticalPhaseWindow {...props} />);
    expect(shallow).toMatchSnapshot();

    expect(Enzyme.shallow(<TheoreticalPhaseWindow {...props} />)).toMatchSnapshot();
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });
  it('componentDidCatch', () => {
    const spy = jest.spyOn(instance, 'componentDidCatch');
    instance.componentDidCatch(new Error('error'), { componentStack: undefined });
    expect(spy).toBeCalled();
  });
});
