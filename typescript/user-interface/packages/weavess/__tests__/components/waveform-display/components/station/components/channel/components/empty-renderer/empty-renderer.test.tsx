/* eslint-disable react/jsx-props-no-spreading */
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { EmptyRenderer } from '../../../../../../../../../src/ts/components/waveform-display/components/station/components/channel/components/empty-renderer/empty-renderer';
import { EmptyRendererProps } from '../../../../../../../../../src/ts/components/waveform-display/components/station/components/channel/components/empty-renderer/types';

const props: EmptyRendererProps = {
  displayStartTimeSecs: 0,
  displayEndTimeSecs: 500
};

const wrapper = Enzyme.mount(<EmptyRenderer {...props} />);
const instance: any = wrapper.find(EmptyRenderer).instance();

describe('Weavess Empty Renderer', () => {
  it('to be defined', () => {
    expect(EmptyRenderer).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<EmptyRenderer {...props} />);
    expect(shallow).toMatchSnapshot();

    expect(Enzyme.shallow(<EmptyRenderer {...props} />)).toMatchSnapshot();
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('component did update', () => {
    const spy1 = jest.spyOn(instance, 'componentDidUpdate');
    const spy2 = jest.spyOn(instance, 'updateCameraBounds');
    instance.componentDidUpdate(props);
    expect(spy1).toBeCalledTimes(1);
    expect(spy2).toBeCalledTimes(0);

    // update the props
    const newcProps: EmptyRendererProps = {
      displayStartTimeSecs: 33,
      displayEndTimeSecs: 700
    };
    instance.componentDidUpdate(newcProps);
    expect(spy1).toBeCalledTimes(2);
    expect(spy2).toBeCalledTimes(1);
  });
});
