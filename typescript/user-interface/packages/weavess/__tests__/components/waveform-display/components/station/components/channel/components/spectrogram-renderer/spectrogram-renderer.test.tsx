/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable react/jsx-props-no-spreading */
import * as Enzyme from 'enzyme';
import * as React from 'react';

import { SpectrogramRenderer } from '../../../../../../../../../src/ts/components/waveform-display/components/station/components/channel/components/spectrogram-renderer/spectrogram-renderer';
import { SpectrogramRendererProps } from '../../../../../../../../../src/ts/components/waveform-display/components/station/components/channel/components/spectrogram-renderer/types';

const props: SpectrogramRendererProps = {
  displayStartTimeSecs: 400,
  displayEndTimeSecs: 700,
  startTimeSecs: 5,
  data: [
    [1, 2, 3, 4, 5],
    [6, 7, 8, 9, 10]
  ],
  frequencyStep: 4,
  timeStep: 2,
  setYAxisBounds: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  colorScale: jest.fn((value: number) => 'ff000')
};

const wrapper = Enzyme.mount(<SpectrogramRenderer {...props} />);
// const instance: any = wrapper.find(SpectrogramRenderer).instance();

describe('Weavess Spectrogram Renderer', () => {
  it('to be defined', () => {
    expect(SpectrogramRenderer).toBeDefined();
  });

  it('shallow renders', () => {
    const shallow = Enzyme.shallow(<SpectrogramRenderer {...props} />);
    expect(shallow).toMatchSnapshot();
  });

  it('renders', () => {
    expect(wrapper).toMatchSnapshot();
  });
});
