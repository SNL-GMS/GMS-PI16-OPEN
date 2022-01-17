import { WeavessTypes } from '@gms/weavess-core';

import {
  getBoundaries,
  GetBoundariesParams
} from '../../../../src/ts/workers/waveform-worker/operations/get-boundaries';
import { BoundaryStore } from '../../../../src/ts/workers/waveform-worker/worker-store/boundary-store';

const params: GetBoundariesParams = { id: 'TestId' };

const bounds: WeavessTypes.ChannelSegmentBoundaries = {
  bottomMax: -100,
  topMax: 100,
  channelAvg: 4,
  channelSegmentId: 'TestChannelSegment',
  offset: 100,
  samplesCount: 20
};

describe('getBoundaries', () => {
  it('has a BoundaryStore it can access', () => {
    expect(BoundaryStore).toBeDefined();
  });

  it('can get boundaries that were previously set', async () => {
    const boundsPromise = new Promise<WeavessTypes.ChannelSegmentBoundaries>(resolve => {
      resolve(bounds);
    });
    BoundaryStore.store(params.id, boundsPromise);
    const result = await getBoundaries(params);
    expect(result.channelSegmentId).toBe(bounds.channelSegmentId);
  });
});
