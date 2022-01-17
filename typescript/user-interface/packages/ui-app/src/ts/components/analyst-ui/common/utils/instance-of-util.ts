import {
  ChannelSegmentTypes,
  FkTypes,
  SignalDetectionTypes,
  WaveformTypes
} from '@gms/common-model';

/**
 * Checks if FK spectra channel segment
 *
 * @param object Channel Segment
 * @returns boolean
 */
// eslint-disable-next-line max-len
export function isFkSpectraChannelSegment(
  object: ChannelSegmentTypes.ChannelSegment<ChannelSegmentTypes.TimeSeries>
): object is ChannelSegmentTypes.ChannelSegment<FkTypes.FkPowerSpectra> {
  return object.timeseriesType === ChannelSegmentTypes.TimeSeriesType.FK_SPECTRA;
}

/**
 * Checks if Signal detection InstantMeasurementValue
 *
 * @param object FeatureMeasurementValue
 * @returns boolean
 */
export function isSdInstantMeasurementValue(
  object: any
): object is SignalDetectionTypes.InstantMeasurementValue {
  return object.value !== undefined && object.standardDeviation !== undefined;
}

/**
 * Checks if Signal detection AmplitudeMeasurementValue
 *
 * @param object FeatureMeasurementValue
 * @returns boolean
 */
export function isSdFeatureMeasurementValue(
  object: any
): object is SignalDetectionTypes.AmplitudeMeasurementValue {
  return (
    object.amplitude !== undefined && object.period !== undefined && object.startTime !== undefined
  );
}

/**
 * Creates/Returns an unfiltered waveform filter
 */
export function createUnfilteredWaveformFilter(): WaveformTypes.WaveformFilter {
  return (WaveformTypes.UNFILTERED_FILTER as any) as WaveformTypes.WaveformFilter;
}
