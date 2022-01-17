/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DistanceUnits } from '@gms/weavess-core/lib/types';
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { Station } from '../../../../../src/ts/components/waveform-display/components/station/station';
import {
  CommonStationProps,
  StationProps
} from '../../../../../src/ts/components/waveform-display/components/station/types';
import { defaultConfiguration } from '../../../../../src/ts/components/waveform-display/configuration';

const MOCK_TIME = 1606818240000;
global.Date.now = jest.fn(() => MOCK_TIME);

const commonProps: CommonStationProps = {
  converters: {
    computeFractionOfCanvasFromMouseXPx: jest.fn(),
    computeTimeSecsForMouseXFractionalPosition: jest.fn(),
    computeTimeSecsFromMouseXPixels: jest.fn()
  },
  getCurrentViewRangeInSeconds: jest.fn(),
  onMouseDown: jest.fn(),
  onMouseMove: jest.fn(),
  onMouseUp: jest.fn(),
  renderWaveforms: jest.fn(),
  onContextMenu: jest.fn(),
  updateMeasureWindow: jest.fn(),
  isMeasureWindow: false
};

const props: StationProps = {
  ...commonProps,
  initialConfiguration: defaultConfiguration,
  station: {
    id: 'station',
    defaultChannel: {
      id: 'default-channel',
      name: 'default-channel'
    },
    name: 'station',
    distance: 0,
    distanceUnits: DistanceUnits.km,
    nonDefaultChannels: [
      {
        id: 'channel',
        name: 'channel',
        waveform: {
          channelSegmentId: '1',
          channelSegments: new Map(),
          masks: [
            {
              id: 'mask',
              color: 'ff0000',
              startTimeSecs: 5,
              endTimeSecs: 10
            }
          ]
        }
      }
    ]
  },
  displayStartTimeSecs: 0,
  displayEndTimeSecs: 500,
  shouldRenderWaveforms: false,
  shouldRenderSpectrograms: false,
  workerRpcs: [],
  selections: {
    channels: [],
    predictedPhases: [],
    signalDetections: []
  },
  getCanvasBoundingRect: jest.fn(() => new DOMRect(0, 0, 100, 100)),
  updateVisibleChannelForStation: jest.fn(),
  events: undefined,
  glMin: 0,
  glMax: 100,
  canvasRef: jest.fn(),
  getViewRange: jest.fn(),
  toast: jest.fn()
};

const wrapper = Enzyme.mount(<Station {...props} />);
const instance: Station = wrapper.find(Station).instance() as Station;

describe('Weavess Station', () => {
  it('to be defined', () => {
    expect(Station).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<Station {...props} />);
    expect(shallow).toMatchSnapshot();

    expect(Enzyme.shallow(<Station {...props} />)).toMatchSnapshot();
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('componentDidCatch', () => {
    const spy = jest.spyOn(instance, 'componentDidCatch');
    instance.componentDidCatch(new Error('error'), { componentStack: undefined });
    expect(spy).toBeCalled();
  });

  it('reset amplitude', () => {
    const spy = jest.spyOn(instance, 'resetAmplitude');
    instance.resetAmplitude();
    expect(spy).toBeCalled();
  });

  it('update mask labels', () => {
    const station = new Station(props);
    const spy = jest.spyOn(station, 'updateMaskLabels');
    station.updateMaskLabels();
    expect(spy).toBeCalled();
  });
});
