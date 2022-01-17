/* eslint-disable @typescript-eslint/no-magic-numbers */
import { WaveformTypes } from '@gms/common-model';
import { readJsonData, toEpochSeconds } from '@gms/common-util';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import { WeavessTypes } from '@gms/weavess-core';
import * as path from 'path';

import { IanQueries } from '../../../../../src/ts/components/analyst-ui/client-interface';
import { WaveformClient } from '../../../../../src/ts/components/analyst-ui/components/waveform/waveform-client';
import { weavessChannelSegment } from '../../../__data__/weavess-channel-segment-data';

const basePath = path.resolve(__dirname, './__data__');
const defaultWaveformFilters = readJsonData(path.resolve(basePath, 'defaultWaveformFilters.json'));

const updateWeavess = jest.fn();
let latestWaveformClientState: AnalystWorkspaceTypes.WaveformClientState;
const setWaveformClientLoadingState = (
  waveformClientState: AnalystWorkspaceTypes.WaveformClientState
) => {
  // Should get numerous callbacks based on loading indicator updating
  expect(waveformClientState).toBeDefined();
  latestWaveformClientState = waveformClientState;
};
const waveformClient: WaveformClient = new WaveformClient(setWaveformClientLoadingState);
const filterIds = defaultWaveformFilters.map(filters => filters.id);
const startTime = toEpochSeconds('2010-05-20T22:00:00.000Z');
const endTime = toEpochSeconds('2010-05-20T23:59:59.000Z');
const currentInterval = {
  startTimeSecs: startTime,
  endTimeSecs: endTime
};

// Mock the fetchWaveform query returns the converted waveform times in Epoch seconds
const mockQueries = {
  WaveformQuery: {
    fetchWaveforms: jest.fn(async (waveformQuery: WaveformTypes.WaveformQueryArgs) => {
      const updatedWeavessChannelSegment: WeavessTypes.ChannelSegment = {
        ...weavessChannelSegment,
        channelName: waveformQuery.channels[0].name,
        dataSegments: weavessChannelSegment.dataSegments.map(ds => {
          return {
            ...ds,
            data: {
              ...ds.data,
              startTimeSecs: waveformQuery.startTime,
              endTimeSecs: waveformQuery.endTime
            }
          };
        })
      };
      return new Promise<WeavessTypes.ChannelSegment[]>(resolve =>
        resolve([updatedWeavessChannelSegment])
      );
    }),
    clearWaveformCaches: jest.fn()
  }
};
Object.assign(IanQueries, mockQueries);

describe('Waveform Client Tests', () => {
  it('test waveform client is defined', () => {
    expect(waveformClient).toBeDefined();
  });
  it('test waveform client state', () => {
    expect(latestWaveformClientState).toMatchSnapshot();
  });

  it('test fetchAndCacheWaveforms', async () => {
    await waveformClient.fetchAndCacheWaveforms(
      ['AAK.AAK.BHZ'],
      filterIds,
      startTime,
      endTime,
      currentInterval,
      updateWeavess
    );
    expect(
      waveformClient.getWaveformEntriesForChannelId('AAK.AAK.BHZ').get(WeavessTypes.UNFILTERED)
        .dataSegments.length
    ).toBeGreaterThan(0);

    expect(waveformClient.getWaveformEntriesForChannelId('AAK.AAK.BHZ')).toMatchSnapshot();
  });

  it('test stopAndClear waveform-client', async () => {
    await waveformClient.fetchAndCacheWaveforms(
      ['AAK.AAK.BHZ'],
      filterIds,
      startTime,
      endTime,
      currentInterval,
      updateWeavess
    );

    // Confirm waveform-client data cache has channel-segment
    expect(waveformClient.getWaveformEntriesForChannelId('AAK.AAK.BHZ')).toBeDefined();

    // Clear the data cache and check is cleared
    waveformClient.stopAndClear();
    expect(
      waveformClient.getWaveformEntriesForChannelId('AAK.AAK.BHZ').get(WeavessTypes.UNFILTERED)
    ).toBeUndefined();
  });

  it('test running query twice should result in 1 channel segment with 4 data segments', async () => {
    await waveformClient.fetchAndCacheWaveforms(
      ['AAK.AAK.BHZ'],
      filterIds,
      startTime,
      endTime,
      currentInterval,
      updateWeavess
    );
    expect(
      waveformClient.getWaveformEntriesForChannelId('AAK.AAK.BHZ').get(WeavessTypes.UNFILTERED)
        .dataSegments
    ).toHaveLength(2);
    // Now re-query with different start/end time
    const newStartTime = 0;
    const newEndTime = 1000;
    await waveformClient.fetchAndCacheWaveforms(
      ['AAK.AAK.BHZ'],
      filterIds,
      newStartTime,
      newEndTime,
      currentInterval,
      updateWeavess
    );
    expect(
      waveformClient.getWaveformEntriesForChannelId('AAK.AAK.BHZ').get(WeavessTypes.UNFILTERED)
        .dataSegments
    ).toHaveLength(4);
    // Get first entry (should only be one raw)
    const updatedWaveformMap: Map<
      string,
      WeavessTypes.ChannelSegment
    > = waveformClient.getWaveformEntriesForChannelId('AAK.AAK.BHZ');
    expect(updatedWaveformMap.get('unfiltered')).toBeDefined();

    // confirm now has 4 data segments based on 2 in weavessChannelSegment from __data__
    expect(updatedWaveformMap.get('unfiltered').dataSegments).toHaveLength(4);
  });
});
