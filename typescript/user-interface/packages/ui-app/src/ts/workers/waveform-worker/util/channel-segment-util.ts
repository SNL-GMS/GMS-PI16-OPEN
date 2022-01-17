import { ChannelSegmentTypes, WaveformTypes } from '@gms/common-model';
import { WeavessTypes } from '@gms/weavess-core';

import { GMSColors, SemanticColors } from '~scss-config/color-preferences';

import { calculateAndStoreBounds } from './boundary-util';
import { formatAndStoreDataSegments } from './data-segment-util';

/**
 * Higher order function that generates a converter that converts waveforms to typed arrays
 * within the given time range (domain).
 *
 * @param domain the low to high bound (inclusive) of timestamps visible in the window
 * @returns a converter function that will return the Weavess.ChannelSegment
 */
export function channelSegToWeavessChannelSegment(domain: WeavessTypes.TimeRange) {
  return function convertWaveformToTypedArray(
    chanSeg: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>,
    gmsColors: GMSColors,
    semanticColors: SemanticColors
  ): WeavessTypes.ChannelSegment {
    const dataSegments = formatAndStoreDataSegments(chanSeg, domain, semanticColors);
    const weavessChannelSegment: WeavessTypes.ChannelSegment = {
      channelName: chanSeg.id.channel.name,
      wfFilterId: WeavessTypes.UNFILTERED,
      description: WaveformTypes.UNFILTERED_FILTER.name,
      descriptionLabelColor: gmsColors.gmsMain,
      dataSegments,
      channelSegmentBoundaries: undefined
    };
    calculateAndStoreBounds(chanSeg.id.channel.name, weavessChannelSegment);
    return weavessChannelSegment;
  };
}

/**
 * Converts the channel segments into the TypedArray format that Weavess can render.
 *
 * @param chanSegments the list of waveform channel segments to convert.
 * @param originalDomain the start and end times of the viewable time span in the Weavess Display
 */
export const convertChannelSegmentsToWeavessTypedArrays = (
  chanSegments: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>[],
  originalDomain: WeavessTypes.TimeRange,
  gmsColors: GMSColors,
  semanticColors: SemanticColors
): WeavessTypes.ChannelSegment[] => {
  const converter = channelSegToWeavessChannelSegment(originalDomain);
  const convertedResults = chanSegments.map(channelSegment =>
    converter(channelSegment, gmsColors, semanticColors)
  );
  return convertedResults;
};
