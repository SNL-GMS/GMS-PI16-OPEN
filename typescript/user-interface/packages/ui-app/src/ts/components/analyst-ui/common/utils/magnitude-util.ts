import {
  ChannelSegmentTypes,
  CommonTypes,
  EventTypes,
  SignalDetectionTypes
} from '@gms/common-model';

import { SignalDetectionUtils } from '~analyst-ui/common/utils';
import { StationMagnitudeSdData } from '~analyst-ui/components/magnitude/components/station-magnitude/types';
import { systemConfig } from '~analyst-ui/config';

/**
 * Returns the station magnitude data for a signal detection that may not be defined
 *
 * @param sd a signal detection to get mag data from
 */
export function getMagnitudeDataForSd(
  sd: SignalDetectionTypes.SignalDetection
): StationMagnitudeSdData {
  const phaseFmValue = SignalDetectionUtils.findPhaseFeatureMeasurementValue(
    sd.currentHypothesis.featureMeasurements
  );
  const timeFm = SignalDetectionUtils.findArrivalTimeFeatureMeasurementValue(
    sd.currentHypothesis.featureMeasurements
  );
  const arrivalFm = SignalDetectionUtils.findArrivalTimeFeatureMeasurement(
    sd.currentHypothesis.featureMeasurements
  );
  // TODO: need to confirm this is an fkb (no longer using ChannelSegmentType)
  const channel =
    arrivalFm &&
    arrivalFm.channelSegment &&
    arrivalFm.channelSegment.timeseriesType === ChannelSegmentTypes.TimeSeriesType.WAVEFORM
      ? 'fkb'
      : 'Not Sure';
  const maybeAmplitudeMeasurement = phaseFmValue
    ? SignalDetectionUtils.findAmplitudeFeatureMeasurementValue(
        sd.currentHypothesis.featureMeasurements,
        systemConfig.amplitudeTypeForPhase.get(phaseFmValue.phase) as any
      )
    : undefined;
  const maybeAmplitude = maybeAmplitudeMeasurement
    ? maybeAmplitudeMeasurement.amplitude.value
    : undefined;
  const maybePeriod = maybeAmplitudeMeasurement ? maybeAmplitudeMeasurement.period : undefined;
  const stationMagnitudeSdData: StationMagnitudeSdData = {
    amplitudePeriod: maybePeriod,
    amplitudeValue: maybeAmplitude,
    phase: phaseFmValue ? phaseFmValue.phase : '',
    // FIXME: What is trim supposed to return?
    channel,
    signalDetectionId: sd.id,
    time: timeFm ? timeFm.value : Infinity,
    stationName: sd.stationName,
    // Show as needs review if the amplitude measurement hasnt been reviewed and if its eligible for review
    flagForReview: !sd.reviewed.amplitudeMeasurement && sd.requiresReview.amplitudeMeasurement
  };
  return stationMagnitudeSdData;
}

/**
 * Returns the station magnitude data for a signal detection snapshot
 *
 * @param maybeSd a signal detection that
 */
export function getMagnitudeDataForSdSnapshot(
  snapshot: EventTypes.SignalDetectionSnapshot
): StationMagnitudeSdData {
  const amplitude =
    // eslint-disable-next-line no-nested-ternary
    snapshot.phase === CommonTypes.PhaseType.P
      ? snapshot.aFiveAmplitude
      : snapshot.phase === CommonTypes.PhaseType.LR
      ? snapshot.aLRAmplitude
      : undefined;
  return {
    amplitudePeriod: amplitude ? amplitude.amplitudeValue : undefined,
    amplitudeValue: amplitude ? amplitude.period : undefined,
    phase: snapshot.phase,
    channel: snapshot.channelName,
    signalDetectionId: snapshot.signalDetectionId,
    time: snapshot.time.observed,
    stationName: snapshot.stationName,
    flagForReview: false
  };
}

/**
 * Gets snapshots for the given lss
 *
 * @param event event whichs holds the lss
 * @param locationSolutionSetId the id
 */
export function getSnapshotsForLssId(
  event: EventTypes.Event,
  locationSolutionSetId: string
): StationMagnitudeSdData[] {
  const maybeLss =
    event && event.currentEventHypothesis && event.currentEventHypothesis.eventHypothesis
      ? event.currentEventHypothesis.eventHypothesis.locationSolutionSets.find(
          lss => lss.id === locationSolutionSetId
        )
      : undefined;
  return maybeLss ? maybeLss.locationSolutions[0].snapshots.map(getMagnitudeDataForSdSnapshot) : [];
}

/**
 * Returns the Network Magnitude Solution based on magnitude type
 *
 * @param locationSolution a location solution
 * @param  magnitudeTYpe a magnitude type
 *
 * @returns a NetworkMagnitudeSolution
 */
export function getNetworkMagSolution(
  locationSolution: EventTypes.LocationSolution,
  magnitudeType: string
): EventTypes.NetworkMagnitudeSolution {
  return locationSolution.networkMagnitudeSolutions.find(
    netMagSol => netMagSol.magnitudeType === magnitudeType
  );
}
