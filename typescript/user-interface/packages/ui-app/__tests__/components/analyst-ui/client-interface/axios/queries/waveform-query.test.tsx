/* eslint-disable jest/expect-expect */
/* eslint-disable @typescript-eslint/no-magic-numbers */
import { ChannelTypes, WaveformTypes } from '@gms/common-model';
import { toEpochSeconds } from '@gms/common-util';
import { WeavessTypes } from '@gms/weavess-core';
import { AxiosError } from 'axios';
import Enzyme from 'enzyme';
import * as React from 'react';
import { UseQueryObjectConfig } from 'react-query';

import {
  clearWaveformCaches,
  createWaveformConfig,
  fetchWaveforms,
  useWaveformQuery,
  waveformQueryConfig
} from '../../../../../../src/ts/components/analyst-ui/client-interface/axios/queries/waveform-query';
import { queryCache } from '../../../../../../src/ts/components/client-interface/axios/queries/query-util';
import { waitForComponentToPaint } from '../../../../../utils/general-utils';

jest.mock('worker-rpc', () => ({
  RpcProvider: jest.fn().mockImplementation(() => {
    // eslint-disable-next-line no-var
    var mockRpc = jest.fn(async () => {
      return new Promise(resolve => {
        resolve('Mock RPC Return Value');
      });
    });
    return { rpc: mockRpc };
  })
}));

const testInterval = {
  startTimeSecs: toEpochSeconds('2021-03-02T17:30:57.376Z'),
  endTimeSecs: toEpochSeconds('2021-03-02T23:30:57.376Z')
};

const expectHookToCallWorker = async (useHook: () => any) => {
  const TestComponent: React.FC = () => {
    const query = useHook();
    return <div>{JSON.stringify(query.data)}</div>;
  };

  // Mounting may call the request, if React decides to run it soon.
  const wrapper = Enzyme.mount(<TestComponent />);

  // This ensures that the axios request will have been called.
  await waitForComponentToPaint(wrapper);

  expect(wrapper).toMatchSnapshot();

  // eslint-disable-next-line @typescript-eslint/unbound-method
  expect(wrapper.text()).toMatch('Mock RPC Return Value');
};

describe('Waveform Query', () => {
  describe('starts with', () => {
    it('a hook for accessing the waveform query defined', () => {
      expect(useWaveformQuery).toBeDefined();
    });
    it('a query config defined', () => {
      expect(waveformQueryConfig).toBeDefined();
    });
    it('fetchWaveforms defined', () => {
      expect(fetchWaveforms).toBeDefined();
    });
  });
  const queryCacheMock = {
    fetchQuery: jest.fn()
  };
  Object.assign(queryCache, queryCacheMock);

  it('hook sends a request to a web worker', async () => {
    const fiveMinutes = 300000;
    const timeNow = Date.now();
    const startTime = (timeNow - fiveMinutes) / 1000;

    const aakChannel: ChannelTypes.ChannelRequest = {
      name: 'AAK.AAK00.BHE',
      effectiveAt: startTime
    };
    const waveformQueryInput: WaveformTypes.WaveformQueryArgs = {
      channels: [aakChannel],
      startTime,
      endTime: timeNow / 1000
    };
    const useTestHook = () => useWaveformQuery(waveformQueryInput, testInterval);
    await expectHookToCallWorker(useTestHook);
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
    queryCacheMock.fetchQuery.mockReturnValueOnce('Query can be fetched');
    const result = await fetchWaveforms(mockWaveformQuery, testInterval);

    expect(result).toEqual('Query can be fetched');
  });

  it('createWaveformConfig returns valid config', () => {
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
    const config: UseQueryObjectConfig<
      WeavessTypes.ChannelSegment[],
      AxiosError
    > = createWaveformConfig(mockWaveformQuery);
    expect(config).toMatchSnapshot();
  });

  it('Clear waveform query cache', () => {
    expect(clearWaveformCaches()).toBeUndefined();
  });
});
