/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable react/jsx-props-no-spreading */
import { WeavessTypes } from '@gms/weavess-core';
import * as Enzyme from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';

import { WaveformRendererProps } from '../../../../../../../../../src/ts/components/waveform-display/components/station/components/channel/components/waveform-renderer/types';
import { WaveformRenderer } from '../../../../../../../../../src/ts/components/waveform-display/components/station/components/channel/components/waveform-renderer/waveform-renderer';

const props: WaveformRendererProps = {
  displayStartTimeSecs: 400,
  displayEndTimeSecs: 700,
  workerRpcs: [],
  defaultRange: {
    min: 4,
    max: 9
  },
  channelName: 'AAK.AAK.BHZ',
  channelSegmentId: WeavessTypes.UNFILTERED,
  channelSegments: new Map<string, WeavessTypes.ChannelSegment>([
    [
      'data',
      {
        channelName: 'WaveformRendererChannel',
        wfFilterId: WeavessTypes.UNFILTERED,
        dataSegments: [
          {
            color: 'dodgerblue',
            displayType: [WeavessTypes.DisplayType.SCATTER],
            pointSize: 2,
            data: {
              startTimeSecs: 450,
              endTimeSecs: 500,
              sampleRate: 1,
              values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
            }
          }
        ]
      }
    ]
  ]),
  masks: [
    {
      id: `mask_1`,
      startTimeSecs: 420,
      endTimeSecs: 440,
      color: 'green'
    }
  ],
  glMin: 0,
  glMax: 100,
  renderWaveforms: jest.fn(),
  setYAxisBounds: jest.fn()
};

const wrapper = Enzyme.mount(<WaveformRenderer {...props} />);
const instance: WaveformRenderer = wrapper.find(WaveformRenderer).instance() as any;

describe('Weavess Waveform Renderer', () => {
  it('to be defined', () => {
    expect(WaveformRenderer).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<WaveformRenderer {...props} />);
    expect(shallow).toMatchSnapshot();
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });

  it('calls render waveforms from updateAmplitude', async () => {
    // update this if it changes. Used to simply verify that the number of calls has increased
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(props.renderWaveforms).toHaveBeenCalledTimes(2);
    await instance.updateAmplitude();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      wrapper.update();
    });
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(props.renderWaveforms).toHaveBeenCalledTimes(3);
  });

  it('calls getBoundaries from updateAmplitude', async () => {
    const mockGetBoundaries = jest.fn();
    const newWrapper = Enzyme.mount(
      <WaveformRenderer {...{ ...props, getBoundaries: mockGetBoundaries }} />
    );
    const newInstance: WaveformRenderer = newWrapper.find(WaveformRenderer).instance() as any;
    expect(mockGetBoundaries).not.toHaveBeenCalled();

    await newInstance.updateAmplitude();
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 200));
      newWrapper.update();
    });
    expect(mockGetBoundaries).toHaveBeenCalled();

    // Call reset amplitude
    expect(newInstance.resetAmplitude()).toBeUndefined();
  });

  it('call componentDidUpdate with various props', async () => {
    const previousPropsDisplayTimeChanges = {
      ...props,
      displayStartTimeSecs: 300,
      displayEndTimeSecs: 600
    };
    expect(await instance.componentDidUpdate(previousPropsDisplayTimeChanges)).toBeUndefined();

    const previousPropsDisplayDiffChanSegId = {
      ...props,
      channelSegmentId: 'foobar'
    };
    expect(await instance.componentDidUpdate(previousPropsDisplayDiffChanSegId)).toBeUndefined();
  });
});
