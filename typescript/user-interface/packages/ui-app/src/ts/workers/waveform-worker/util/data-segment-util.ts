import { ChannelSegmentTypes, WaveformTypes } from '@gms/common-model';
import { uuid } from '@gms/common-util';
import { WeavessTypes, WeavessUtil } from '@gms/weavess-core';

import { SemanticColors } from '~scss-config/color-preferences';

import { WaveformStore } from '../worker-store/waveform-store';

/**
 * Make a DataBySampleRate object from the provided waveform
 *
 * @param wave the waveform from which to get the data
 * @returns the DataBySampleRate object
 */
export const getDataBySampleRate = (
  wave: WaveformTypes.Waveform
): WeavessTypes.DataBySampleRate => ({
  sampleRate: wave.sampleRateHz,
  startTimeSecs: wave.startTime,
  endTimeSecs: wave.endTime,
  values: wave.samples
});

const calculateAndStorePositionBuffer = (
  wave: WaveformTypes.Waveform,
  domain: WeavessTypes.TimeRange
) => {
  const id = uuid.asString();
  const positionBufferPromise = new Promise<Float32Array>(resolve => {
    resolve(WeavessUtil.convertToPositionBuffer(getDataBySampleRate(wave), domain));
  });
  WaveformStore.store(id, positionBufferPromise);
  return id;
};

/**
 * Gets the sample rate in Hz for the channel segment provided. Falls back to a default
 * if there are no timeseries in the channel segment.
 *
 * @param chanSeg the channel segment for which to get the sample rate
 * @returns the sample rate of the data in the channel segment
 */
const getSampleRate = (chanSeg: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>) =>
  chanSeg.timeseries ? chanSeg.timeseries[0].sampleRateHz : WaveformTypes.DEFAULT_SAMPLE_RATE;

/**
 * Converts the ChannelSegmentTypes.ChannelSegment waveform to a WeavessTypes.ChannelSegment
 *
 * @param channelSegment returned from waveform query
 * @param domain TimeRange of Current Interval
 * @param semanticColors Color for raw waveform
 * @returns object with list of dataSegments, description, showLabel (boolean), channelSegmentBoundaries
 */
export function formatAndStoreDataSegments(
  channelSegment: ChannelSegmentTypes.ChannelSegment<WaveformTypes.Waveform>,
  domain: WeavessTypes.TimeRange,
  semanticColors: SemanticColors
): WeavessTypes.DataSegment[] {
  // If there was no raw data and no filtered data return empty data segments
  if (!channelSegment || !channelSegment.timeseries || channelSegment.timeseries.length === 0) {
    return [];
  }

  const sampleRate = getSampleRate(channelSegment);

  const dataSegments = channelSegment.timeseries.map<WeavessTypes.DataSegment>(
    (wave: WaveformTypes.Waveform) => {
      const dataSegId = calculateAndStorePositionBuffer(wave, domain);
      return {
        displayType: [WeavessTypes.DisplayType.LINE],
        color: semanticColors.waveformRaw,
        pointSize: 1,
        data: {
          startTimeSecs: wave.startTime,
          endTimeSecs: wave.endTime,
          sampleRate,
          values: undefined, // vertices
          id: dataSegId
        }
      };
    }
  );

  return dataSegments;
}
