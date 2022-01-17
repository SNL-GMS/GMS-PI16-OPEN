import { WeavessTypes } from '@gms/weavess-core';

import { calculateChannelSegBounds } from '../util/boundary-util';
import { BoundaryStore } from '../worker-store/boundary-store';

export interface GetBoundariesParams {
  id: string;
  channelSegment?: WeavessTypes.ChannelSegment;
  startTimeSecs?: number;
  endTimeSecs?: number;
}

/**
 * Retrieves the boundaries object from the worker store, calculating it if it has not already been calculated.
 *
 * @param params an object containing the ID of the channel segment for which to get boundaries
 * @returns a promise for the boundaries object.
 */
export const getBoundaries = async ({
  id,
  channelSegment,
  startTimeSecs,
  endTimeSecs
}: GetBoundariesParams): Promise<WeavessTypes.ChannelSegmentBoundaries> => {
  if (startTimeSecs === undefined && endTimeSecs === undefined) {
    return BoundaryStore.retrieve(id);
  }

  return calculateChannelSegBounds(channelSegment, startTimeSecs, endTimeSecs);
};
