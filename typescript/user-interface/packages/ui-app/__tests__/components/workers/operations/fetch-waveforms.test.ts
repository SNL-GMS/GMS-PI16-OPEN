/* eslint-disable jest/expect-expect */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ChannelSegmentTypes, CommonTypes, WaveformTypes } from '@gms/common-model';
import { toEpochSeconds, uuid } from '@gms/common-util';
import Axios, { AxiosResponse } from 'axios';

import { gmsColors, semanticColors } from '~scss-config/color-preferences';

import { defaultConfig } from '../../../../src/ts/config/endpoint-configuration';
import {
  fetchWaveforms,
  requestAndConvertWaveforms
} from '../../../../src/ts/workers/waveform-worker/operations/fetch-waveforms';

uuid.asString = jest.fn().mockReturnValue('66f353ac-6fe7-401a-b40f-4ce1dc266dd7');

const waveform: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform> = {
  units: CommonTypes.Units.NANOMETERS,
  id: {
    channel: {
      name: 'AAK.AAK.BH1',
      effectiveAt: 1614706257.376
    },
    startTime: 1614706257.376,
    endTime: 1614706257.376,
    creationTime: 1614706257.376
  },
  timeseriesType: ChannelSegmentTypes.TimeSeriesType.WAVEFORM,
  timeseries: [
    {
      endTime: 1614727857.376,
      type: ChannelSegmentTypes.TimeSeriesType.WAVEFORM,
      startTime: 1614706257.376,
      sampleRateHz: 40,
      samples: [
        223.633869,
        227.47485600000002,
        231.592173,
        226.811664,
        234.90813300000002,
        232.39353,
        228.55254300000001,
        231.757971,
        227.47485600000002,
        224.24179500000002,
        231.675072,
        234.687069,
        229.10520300000002,
        234.687069,
        224.68392300000002,
        223.164108
      ],
      sampleCount: 16
    }
  ]
};

const testInterval = {
  startTimeSecs: toEpochSeconds('2021-03-02T17:30:57.376Z'),
  endTimeSecs: toEpochSeconds('2021-03-02T23:30:57.376Z')
};

describe('Waveform Query', () => {
  describe('starts with', () => {
    it('fetchWaveforms defined', () => {
      expect(fetchWaveforms).toBeDefined();
    });
    it('requestAndConvertWaveforms defined', () => {
      expect(requestAndConvertWaveforms).toBeDefined();
    });
  });

  it('fetchWaveForms returns the expected result with valid args', async () => {
    const mockWaveformQuery: WaveformTypes.WaveformQueryArgs = {
      startTime: toEpochSeconds('2021-03-02T17:30:57.376Z'),
      endTime: toEpochSeconds('2021-03-02T23:30:57.376Z'),
      channels: [
        {
          name: 'AAK.AAK.BHN',
          effectiveAt: toEpochSeconds('2021-03-02T17:30:57.376Z')
        }
      ]
    };
    const response: AxiosResponse<ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[]> = {
      status: 200,
      config: {},
      headers: {},
      statusText: '',
      data: [waveform]
    };
    Axios.request = jest.fn().mockImplementation(async () => Promise.resolve(response));

    const config =
      defaultConfig.waveformConfiguration.services.getWaveformConfiguration.requestConfig;
    config.data = mockWaveformQuery;
    const result = await fetchWaveforms({
      queryKey: 'waveform',
      requestConfig: config,
      originalDomain: testInterval,
      gmsColors,
      semanticColors
    });

    expect(result).toMatchSnapshot();
  });
});
