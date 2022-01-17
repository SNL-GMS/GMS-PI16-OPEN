/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { PickMarker } from '../../../../../../src/ts/components/waveform-display/components/markers/pick-marker/pick-marker';
import { PickMarkerProps } from '../../../../../../src/ts/components/waveform-display/components/markers/pick-marker/types';

const props: PickMarkerProps = {
  id: 'my-id',
  channelId: 'my-channel',
  startTimeSecs: 500,
  endTimeSecs: 600,
  position: 8,
  label: 'my pick marker',
  color: 'ff000',
  filter: 'none',
  timeSecs: 540,
  predicted: false,
  isConflicted: false,
  isSelected: false,
  disableModification: false,
  onClick: jest.fn(),
  toast: jest.fn(),
  getTimeSecsForClientX: jest.fn(() => 2),
  toggleDragIndicator: jest.fn(),
  positionDragIndicator: jest.fn(),
  onContextMenu: jest.fn(),
  onDragEnd: jest.fn()
};

const event: any = {
  stopPropagation: jest.fn(),
  target: {
    offsetLeft: 5
  },
  nativeEvent: {
    offsetX: 200,
    offsetY: 180
  }
};

const wrapper = Enzyme.mount(<PickMarker {...props} />);
const instance: PickMarker = wrapper.find(PickMarker).instance() as PickMarker;

describe('Weavess PickMarker Marker', () => {
  it('Weavess Pick Marker to be defined', () => {
    expect(PickMarker).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<PickMarker {...props} />);
    expect(shallow).toMatchSnapshot();
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('componentDidUpdate', () => {
    const spy = jest.spyOn(instance, 'componentDidUpdate');

    instance.componentDidUpdate({
      ...props
    });
    expect(spy).toBeCalledTimes(1);

    instance.componentDidUpdate({
      ...props,
      position: 22
    });
    expect(spy).toBeCalledTimes(2);

    instance.componentDidUpdate({
      ...props,
      color: '0000ff'
    });
    expect(spy).toBeCalledTimes(3);
  });

  it('componentDidCatch', () => {
    const spy = jest.spyOn(instance, 'componentDidCatch');
    instance.componentDidCatch(new Error('error'), { componentStack: undefined });
    expect(spy).toBeCalled();
  });

  it('onClick', () => {
    const pm: any = new PickMarker(props);
    const spy = jest.spyOn(pm, 'onClick');
    pm.onClick(event);
    expect(spy).toHaveBeenCalled();
  });

  it('onContextMenu', () => {
    const pm: any = new PickMarker(props);
    const spy = jest.spyOn(pm, 'onContextMenu');
    pm.onContextMenu(event);
    expect(spy).toHaveBeenCalled();
  });

  it('onMouseDown', () => {
    let pm: any = new PickMarker(props);
    let spy = jest.spyOn(pm, 'onMouseDown');
    pm.onMouseDown(event);
    expect(spy).toHaveBeenCalled();

    pm = new PickMarker({ ...props, disableModification: true, isConflicted: true });
    spy = jest.spyOn(pm, 'onMouseDown');
    pm.onMouseDown(event);
    expect(spy).toHaveBeenCalled();

    pm = new PickMarker({ ...props, disableModification: true, predicted: true });
    spy = jest.spyOn(pm, 'onMouseDown');
    pm.onMouseDown(event);
    expect(spy).toHaveBeenCalled();

    pm = new PickMarker({ ...props, disableModification: true });
    spy = jest.spyOn(pm, 'onMouseDown');
    pm.onMouseDown(event);
    expect(spy).toHaveBeenCalled();
  });

  it('onMouseUp', () => {
    const pm: any = new PickMarker(props);
    const spy = jest.spyOn(pm, 'onMouseUp');
    pm.onMouseUp(event);
    expect(spy).toHaveBeenCalled();
  });
});
