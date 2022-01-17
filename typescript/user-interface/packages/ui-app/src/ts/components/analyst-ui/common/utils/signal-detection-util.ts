/* eslint-disable @typescript-eslint/no-use-before-define */
import { CommonTypes, EventTypes, SignalDetectionTypes, WaveformTypes } from '@gms/common-model';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import { WeavessTypes } from '@gms/weavess-core';
import flatMap from 'lodash/flatMap';
import forEach from 'lodash/forEach';
import sortBy from 'lodash/sortBy';

import { systemConfig } from '~analyst-ui/config';
import { gmsColors, semanticColors } from '~scss-config/color-preferences';

import {
  AMPLITUDE_VALUES,
  FREQUENCY_VALUES,
  NOMINAL_CALIBRATION_PERIOD
} from './amplitude-scale-constants';

/** Moved util functions from common-graphql */

/**
 * Searches Feature Measurements for the desired Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 * @param featureMeasurementType Enum of desired Feature Measurement desired
 *
 * @returns FeatureMeasurement or undefined if not found
 */
export function findFeatureMeasurement(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[],
  featureMeasurementType: SignalDetectionTypes.FeatureMeasurementTypeName
): SignalDetectionTypes.FeatureMeasurement | undefined {
  if (featureMeasurements && featureMeasurementType) {
    return featureMeasurements.find(fm => fm.featureMeasurementType === featureMeasurementType);
  }
  return undefined;
}

/**
 * Searches Feature Measurements for the ArrivalTime Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns ArrivalTime FeatureMeasurement or undefined if not found
 */
export function findArrivalTimeFeatureMeasurement(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[]
): SignalDetectionTypes.FeatureMeasurement | undefined {
  return findFeatureMeasurement(
    featureMeasurements,
    SignalDetectionTypes.FeatureMeasurementTypeName.ARRIVAL_TIME
  );
}

/**
 * Searches Feature Measurements for the ArrivalTime Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns ArrivalTime FeatureMeasurementValue or undefined if not found
 */
export function findArrivalTimeFeatureMeasurementValue(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[]
): SignalDetectionTypes.InstantMeasurementValue | undefined {
  const fm = findArrivalTimeFeatureMeasurement(featureMeasurements);
  return fm ? (fm.measurementValue as SignalDetectionTypes.InstantMeasurementValue) : undefined;
}

/**
 * Searches Feature Measurements for the Azimuth Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Azimuth FeatureMeasurement or undefined if not found
 */
export function findAzimuthFeatureMeasurement(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[]
): SignalDetectionTypes.FeatureMeasurement | undefined {
  const azimuthList: SignalDetectionTypes.FeatureMeasurementTypeName[] = [
    SignalDetectionTypes.FeatureMeasurementTypeName.RECEIVER_TO_SOURCE_AZIMUTH,
    SignalDetectionTypes.FeatureMeasurementTypeName.SOURCE_TO_RECEIVER_AZIMUTH
  ];
  // Search FeatureMeasurements to find which type of Azimuth was supplied
  return featureMeasurements.find(
    fm => azimuthList.find(azTypeName => azTypeName === fm.featureMeasurementType) !== undefined
  );
}

/**
 * Searches Feature Measurements for the Azimuth Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Azimuth FeatureMeasurementValue or undefined if not found
 */
export function findAzimuthFeatureMeasurementValue(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[]
): SignalDetectionTypes.NumericMeasurementValue | undefined {
  const fm = findAzimuthFeatureMeasurement(featureMeasurements);
  return fm ? (fm.measurementValue as SignalDetectionTypes.NumericMeasurementValue) : undefined;
}

/**
 * Searches Feature Measurements for the Slowness Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Slowness FeatureMeasurement or undefined if not found
 */
export function findSlownessFeatureMeasurement(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[]
): SignalDetectionTypes.FeatureMeasurement | undefined {
  return findFeatureMeasurement(
    featureMeasurements,
    SignalDetectionTypes.FeatureMeasurementTypeName.SLOWNESS
  );
}

/**
 * Searches Feature Measurements for the Slowness Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Slowness FeatureMeasurementValue or undefined if not found
 */
export function findSlownessFeatureMeasurementValue(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[]
): SignalDetectionTypes.NumericMeasurementValue | undefined {
  const fm = findSlownessFeatureMeasurement(featureMeasurements);
  return fm ? (fm.measurementValue as SignalDetectionTypes.NumericMeasurementValue) : undefined;
}

/**
 * Searches Feature Measurements for the Amplitude Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 * @returns Phase FeatureMeasurement or undefined if not found
 */
export function findAmplitudeFeatureMeasurement(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[],
  amplitudeName: SignalDetectionTypes.FeatureMeasurementTypeName
): SignalDetectionTypes.FeatureMeasurement | undefined {
  // Search FeatureMeasurements to find which type of Amplitude was supplied
  return featureMeasurements.find(fm => fm.featureMeasurementType === amplitudeName);
}

/**
 * Searches Feature Measurements for the Amplitude Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 * @returns Phase FeatureMeasurementValue or undefined if not found
 */
export function findAmplitudeFeatureMeasurementValue(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[],
  amplitudeName: SignalDetectionTypes.FeatureMeasurementTypeName
): SignalDetectionTypes.AmplitudeMeasurementValue | undefined {
  const maybeMeasurement = findAmplitudeFeatureMeasurement(featureMeasurements, amplitudeName);
  return maybeMeasurement
    ? (maybeMeasurement.measurementValue as SignalDetectionTypes.AmplitudeMeasurementValue)
    : undefined;
}

/**
 * Searches Feature Measurements for the Phase Feature Measurement
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Phase FeatureMeasurement or undefined if not found
 */
export function findPhaseFeatureMeasurement(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[]
): SignalDetectionTypes.FeatureMeasurement | undefined {
  return findFeatureMeasurement(
    featureMeasurements,
    SignalDetectionTypes.FeatureMeasurementTypeName.PHASE
  );
}

/**
 * Searches Feature Measurements for the Phase Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 *
 * @returns Phase FeatureMeasurementValue or undefined if not found
 */
export function findPhaseFeatureMeasurementValue(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[]
): SignalDetectionTypes.PhaseTypeMeasurementValue | undefined {
  const fm = findPhaseFeatureMeasurement(featureMeasurements);
  return fm ? (fm.measurementValue as SignalDetectionTypes.PhaseTypeMeasurementValue) : undefined;
}

/**
 * Searches Feature Measurements for the Phase Feature Measurement Value
 *
 * @param featureMeasurements List of feature measurements
 *
 * @returns Phase FeatureMeasurementValue or undefined if not found
 */
export function findFilteredBeamFeatureMeasurement(
  featureMeasurements: SignalDetectionTypes.FeatureMeasurement[],
  filterDefinitionId: string
): SignalDetectionTypes.FeatureMeasurement | undefined {
  if (featureMeasurements) {
    const filteredBeamFM = featureMeasurements.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (fm: any) =>
        fm.featureMeasurementType ===
          SignalDetectionTypes.FeatureMeasurementTypeName.FILTERED_BEAM &&
        fm.measurementValue.strValue === filterDefinitionId
    );
    return filteredBeamFM;
  }
  return undefined;
}

/**
 * Determine the color for the detection list marker based on the state of the detection.
 *
 * @param detection signal detection
 */
export function determineDetectionColor(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  currentOpenEventId: string
): string {
  const associatedEventHypos = findEventHypothesisForDetection(detection, events);
  const isComplete = determineIfComplete(detection, events);
  const isSelectedEvent = determineIfAssociated(detection, events, currentOpenEventId);
  // eslint-disable-next-line no-nested-ternary
  const color = isSelectedEvent
    ? semanticColors.analystOpenEvent
    : // eslint-disable-next-line no-nested-ternary
    isComplete
    ? semanticColors.analystComplete
    : associatedEventHypos.length > 0
    ? semanticColors.analystToWork
    : semanticColors.analystUnassociated;
  return color;
}

/**
 * Determine if a signal detection is associated to an event.
 *
 * @param detection signal detection
 * @returns boolean
 */
export function determineIfAssociated(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  currentOpenEventId: string
): boolean {
  if (!currentOpenEventId || !events) {
    return false;
  }
  const associatedEventHypo = findEventHypothesisForDetection(detection, events);
  return (
    associatedEventHypo.find(assoc => assoc.event.id === currentOpenEventId && !assoc.rejected) !==
    undefined
  );
}

/**
 * Determine if a signal detection is complete.
 *
 * @param detection signal detection
 * @returns boolean
 */
export function determineIfComplete(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[]
): boolean {
  if (!events) {
    return false;
  }
  const associatedEventHypos = findEventHypothesisForDetection(detection, events);
  let isComplete = false;
  associatedEventHypos.forEach(assocEvent => {
    isComplete = isComplete || assocEvent.event.status === 'Complete';
  });
  return isComplete;
}

/**
 * Search the associated event hypothesis for one pointing at the open event id,
 * else return first in list or undefined
 *
 * @param detection signal detection
 * @return EventHypothesis | undefined
 */
export function findEventHypothesisForDetection(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[]
): EventTypes.EventHypothesis[] {
  if (events) {
    // If the event has the detection in it's associated signal detection
    return flatMap(events.map(evt => evt.currentEventHypothesis.eventHypothesis)).filter(event =>
      event.signalDetectionAssociations.find(
        assoc => assoc.signalDetectionHypothesis.id === detection.currentHypothesis.id
      )
    );
  }
  return [];
}

/**
 * Search the events if no event association is found then the SD is unassociated
 *
 * @param detection signal detection
 * @param events The events in time range
 * @return boolean
 */
export function isSignalDetectionUnassociated(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[]
): boolean {
  // If any of the events has the detection in it's associated signal detection
  if (events) {
    // Look through the event's signalDetectionAssociations to find a reference to the SD Hypo
    return (
      events.find(
        event =>
          event.currentEventHypothesis.eventHypothesis.signalDetectionAssociations.find(
            assoc => assoc.signalDetectionHypothesis.id === detection.currentHypothesis.id
          ) !== undefined
      ) === undefined
    );
  }
  return true;
}

/**
 * Search the events if an association is found to an event (but not the currently open event)
 * then return true
 *
 * @param detection signal detection
 * @param events The events in time range
 * @return boolean
 */
export function isSignalDetectionOtherAssociated(
  detection: SignalDetectionTypes.SignalDetection,
  events: EventTypes.Event[],
  currentOpenEventId: string
): boolean {
  // If any of the events has the detection in it's associated signal detection
  if (events) {
    // Look through the event's signalDetectionAssociations to find a reference to the SD Hypo
    return (
      events.find(
        event =>
          event.id !== currentOpenEventId &&
          event.currentEventHypothesis.eventHypothesis.signalDetectionAssociations.find(
            assoc => assoc.signalDetectionHypothesis.id === detection.currentHypothesis.id
          ) !== undefined
      ) !== undefined
    );
  }
  return false;
}

/**
 * Returns the signal detection beams for given waveform filter.
 *
 * @param signalDetections the signal detections
 * @param waveformFilter the waveform filter to get beams for
 */
export function getSignalDetectionBeams(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  waveformFilter: Partial<WaveformTypes.WaveformFilter>
): WaveformTypes.Waveform[] | undefined {
  return flatMap(
    signalDetections
      .filter(detection => detection)
      .map(detection => {
        // eslint-disable-next-line no-nested-ternary
        const fm: SignalDetectionTypes.FeatureMeasurement = waveformFilter
          ? waveformFilter.name === WaveformTypes.UNFILTERED_FILTER.name
            ? findArrivalTimeFeatureMeasurement(detection.currentHypothesis.featureMeasurements)
            : findFilteredBeamFeatureMeasurement(
                detection.currentHypothesis.featureMeasurements,
                waveformFilter.id
              )
          : undefined;

        if (fm && fm.channelSegment) {
          return fm.channelSegment.timeseries.map(t => t as WaveformTypes.Waveform);
        }
        return undefined;
      })
  ).filter(ts => ts !== undefined);
}

/**
 * Calculates a new amplitude measurement value given the [min,max] peak/trough
 *
 * @param peakAmplitude the peak amplitude
 * @param troughAmplitude the trough amplitude
 * @param peakTime the peak time
 * @param troughTime the trough time
 */
export function calculateAmplitudeMeasurementValue(
  peakAmplitude: number,
  troughAmplitude: number,
  peakTime: number,
  troughTime: number
): SignalDetectionTypes.AmplitudeMeasurementValue {
  const amplitudeValue = (peakAmplitude - troughAmplitude) / 2;
  const period = Math.abs(peakTime - troughTime) * 2;
  const amplitudeMeasurementValue: SignalDetectionTypes.AmplitudeMeasurementValue = {
    amplitude: {
      value: amplitudeValue,
      standardDeviation: 0,
      units: CommonTypes.Units.UNITLESS
    },
    period,
    startTime: Math.min(troughTime, peakTime)
  };
  return amplitudeMeasurementValue;
}

/**
 * Returns true if the period, trough, or peak times are in warning.
 *
 * @para signalDetectionArrivalTime the arrival time of the signal detection
 * @param period The period value to check
 * @param troughTime The trough time (seconds)
 * @param peakTime The peak time (seconds)
 */
export function isPeakTroughInWarning(
  signalDetectionArrivalTime: number,
  period: number,
  troughTime: number,
  peakTime: number
): boolean {
  const { min } = systemConfig.measurementMode.peakTroughSelection.warning;
  const { max } = systemConfig.measurementMode.peakTroughSelection.warning;
  const { startTimeOffsetFromSignalDetection } = systemConfig.measurementMode.selection;
  const { endTimeOffsetFromSignalDetection } = systemConfig.measurementMode.selection;
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const selectionStart = signalDetectionArrivalTime + startTimeOffsetFromSignalDetection;
  // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
  const selectionEnd = signalDetectionArrivalTime + endTimeOffsetFromSignalDetection;

  // check that the period is within the correct limits
  // check that peak trough start/end are within the selection area
  return (
    period < min ||
    period > max ||
    peakTime < troughTime ||
    troughTime < selectionStart ||
    troughTime > selectionEnd ||
    peakTime < selectionStart ||
    peakTime > selectionEnd
  );
}

/**
 * Finds the [min,max] for the amplitude for peak trough.
 *
 * @param startIndex the starting index into the array
 * @param data the array of values of data
 */
export function findMinMaxAmplitudeForPeakTrough(
  startIndex: number,
  data: number[] | Float32Array
): {
  min: { index: number; value: number };
  max: { index: number; value: number };
} {
  if (
    startIndex !== undefined &&
    data !== undefined &&
    startIndex >= 0 &&
    startIndex < data.length &&
    data.length > 0
  ) {
    const numericalData = Array.from(data);
    const valuesAndIndex = numericalData.map((value: number, index: number) => ({ index, value }));
    // eslint-disable-next-line newline-per-chained-call
    const left = valuesAndIndex.slice(0, startIndex + 1).reverse();
    const right = valuesAndIndex.slice(startIndex, data.length);

    const findMinMax = (values: { index: number; value: number }[]) => {
      const startValue = values.slice(0)[0];
      const nextDiffValue = values.find(v => v.value !== startValue.value);
      const isFindingMax = nextDiffValue && nextDiffValue.value > startValue.value;
      const result = { min: startValue, max: startValue };
      // eslint-disable-next-line consistent-return
      forEach(values, nextValue => {
        if (isFindingMax && nextValue.value >= result.max.value) {
          result.max = nextValue;
        } else if (!isFindingMax && nextValue.value <= result.min.value) {
          result.min = nextValue;
        } else {
          return false; // completed searching
        }
      });
      return result;
    };

    const leftMinMax = findMinMax(left);
    const rightMinMax = findMinMax(right);
    const minMax = [leftMinMax.min, leftMinMax.max, rightMinMax.min, rightMinMax.max];

    const min = minMax.reduce(
      (previous: { value: number; index: number }, current: { value: number; index: number }) =>
        // eslint-disable-next-line no-nested-ternary
        current.value < previous.value
          ? current
          : current.value === previous.value &&
            Math.abs(startIndex - current.index) > Math.abs(startIndex - previous.index)
          ? current
          : previous
    );

    const max = minMax.reduce(
      (previous: { value: number; index: number }, current: { value: number; index: number }) =>
        // eslint-disable-next-line no-nested-ternary
        current.value > previous.value
          ? current
          : current.value === previous.value &&
            Math.abs(startIndex - current.index) > Math.abs(startIndex - previous.index)
          ? current
          : previous
    );

    return min.value !== max.value
      ? { min, max }
      : {
          // handle the case for a flat line; ensure the furthest indexes
          min: {
            value: min.value,
            index: Math.min(...minMax.map(v => v.index))
          },
          max: {
            value: max.value,
            index: Math.max(...minMax.map(v => v.index))
          }
        };
  }
  return { min: { index: 0, value: 0 }, max: { index: 0, value: 0 } };
}

/**
 * Scales the amplitude measurement value.
 *
 * @param amplitudeMeasurementValue the amplitude measurement value to scale
 */
export function scaleAmplitudeMeasurementValue(
  amplitudeMeasurementValue: SignalDetectionTypes.AmplitudeMeasurementValue
): SignalDetectionTypes.AmplitudeMeasurementValue {
  if (amplitudeMeasurementValue === null && amplitudeMeasurementValue === undefined) {
    throw new Error(`amplitude measurement value must be defined`);
  }
  return {
    ...amplitudeMeasurementValue,
    amplitude: {
      ...amplitudeMeasurementValue.amplitude,
      value: scaleAmplitudeForPeakTrough(
        amplitudeMeasurementValue.amplitude.value,
        amplitudeMeasurementValue.period
      )
    }
  };
}

/**
 * Scales the amplitude value using the provided period,
 * nominal calibration period, and the frequency and amplitude values.
 *
 * @param amplitude the amplitude value to scale
 * @param period the period value
 * @param nominalCalibrationPeriod the nominal calibration period
 * @param frequencyValues the frequency values
 * @param amplitudeValues the amplitude values
 */
export function scaleAmplitudeForPeakTrough(
  amplitude: number,
  period: number,
  nominalCalibrationPeriod: number = NOMINAL_CALIBRATION_PERIOD,
  frequencyValues: number[] = FREQUENCY_VALUES,
  amplitudeValues: number[] = AMPLITUDE_VALUES
): number {
  if (
    frequencyValues === null ||
    frequencyValues === undefined ||
    frequencyValues.length === 0 ||
    amplitudeValues === null ||
    amplitudeValues === undefined ||
    amplitudeValues.length === 0
  ) {
    throw new Error(`frequency scale values and amplitude scale values must be defined`);
  }

  if (frequencyValues.length !== amplitudeValues.length) {
    throw new Error(
      `frequency scale values and amplitude scale values do not have the same length: ` +
        `[${frequencyValues.length} !== ${amplitudeValues.length}]`
    );
  }

  // calculate the period
  const periodValues = frequencyValues.map(freq => 1 / freq);

  const findClosestCorrespondingValue = (
    value: number,
    values: number[]
  ): { index: number; value: number } =>
    values
      .map((val: number, index: number) => ({ index, value: val }))
      .reduce(
        (previous: { index: number; value: number }, current: { index: number; value: number }) =>
          Math.abs(current.value - value) < Math.abs(previous.value - value) ? current : previous
      );

  const calculatedPeriod = findClosestCorrespondingValue(period, periodValues);
  const calculatedAmplitude = amplitudeValues[calculatedPeriod.index];

  const calibrationPeriod = findClosestCorrespondingValue(nominalCalibrationPeriod, periodValues);
  const calibrationAmplitude = amplitudeValues[calibrationPeriod.index];
  const normalizedAmplitude = calculatedAmplitude / calibrationAmplitude;
  return amplitude / normalizedAmplitude;
}

/**
 * Returns the waveform value and index (into the values) for a given time in seconds
 *
 * @param waveform the waveform
 * @param timeSecs the time in seconds
 */
export function getWaveformValueForTime(
  waveform: WaveformTypes.Waveform,
  timeSecs: number
): { index: number; value: number } | undefined {
  if (waveform) {
    const index =
      timeSecs <= waveform.startTime
        ? 0
        : Math.round((timeSecs - waveform.startTime) * waveform.sampleRateHz);
    return { index, value: waveform.samples[index] };
  }
  return undefined;
}

/**
 * Determines the [min,max] for the peak trough of a waveform.
 *
 * @param waveform the waveform
 * @param timeSecs the starting point to start searching for the [min, max]
 */
export function determineMinMaxForPeakTroughForWaveform(
  waveform: WaveformTypes.Waveform,
  timeSecs: number
): { minTimeSecs: number; min: number; maxTimeSecs: number; max: number } {
  if (waveform) {
    const startIndex = getWaveformValueForTime(waveform, timeSecs);

    if (startIndex) {
      const minMax = findMinMaxAmplitudeForPeakTrough(startIndex.index, waveform.samples);
      // transform the [min, max] index to the time
      return {
        minTimeSecs: waveform.startTime + minMax.min.index / waveform.sampleRateHz,
        min: minMax.min.value,
        maxTimeSecs: waveform.startTime + minMax.max.index / waveform.sampleRateHz,
        max: minMax.max.value
      };
    }
  }
  return { minTimeSecs: 0, min: 0, maxTimeSecs: 0, max: 0 };
}

/**
 * Determines the [min,max] for the peak trough of a signal detection.
 *
 * @param signalDetection the signal detection
 * @param timeSecs the starting point to start searching for the [min, max]
 * @param waveformFilter the waveform filter used to look up the correct signal detection beam
 */
export function determineMinMaxForPeakTroughForSignalDetection(
  signalDetection: SignalDetectionTypes.SignalDetection,
  timeSecs: number,
  waveformFilter: WaveformTypes.WaveformFilter
): { minTimeSecs: number; min: number; maxTimeSecs: number; max: number } {
  const waveforms = getSignalDetectionBeams([signalDetection], waveformFilter);
  if (waveforms && waveforms.length === 1) {
    return determineMinMaxForPeakTroughForWaveform(waveforms[0], timeSecs);
  }
  return { minTimeSecs: 0, min: 0, maxTimeSecs: 0, max: 0 };
}

/**
 * Returns the waveform value and index (into the values) for a given time in seconds
 *
 * @param signalDetection the signal detection
 * @param timeSecs the starting point to start searching for the [min, max]
 * @param waveformFilter the waveform filter used to look up the correct signal detection beam
 */
export function getWaveformValueForSignalDetection(
  signalDetection: SignalDetectionTypes.SignalDetection,
  timeSecs: number,
  waveformFilter: WaveformTypes.WaveformFilter
): { index: number; value: number } | undefined {
  const waveforms = getSignalDetectionBeams([signalDetection], waveformFilter);
  if (waveforms && waveforms.length === 1) {
    return getWaveformValueForTime(waveforms[0], timeSecs);
  }
  return undefined;
}

/**
 * Sorts the provided signal detections by arrival time and the
 * specified sort type.
 *
 * @param signalDetections the list of signal detections to sort
 * @param waveformSortType the sort type
 * @param distances the distance to source for each station
 */
export function sortAndOrderSignalDetections(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  waveformSortType: AnalystWorkspaceTypes.WaveformSortType,
  distances: EventTypes.LocationToStationDistance[]
): SignalDetectionTypes.SignalDetection[] {
  // sort the sds by the arrival time
  const sortByArrivalTime: SignalDetectionTypes.SignalDetection[] = sortBy<
    SignalDetectionTypes.SignalDetection
  >(
    signalDetections,
    sd => findArrivalTimeFeatureMeasurementValue(sd.currentHypothesis.featureMeasurements).value
  );

  // sort by the selected sort type
  const sortedEntries: SignalDetectionTypes.SignalDetection[] = sortBy<
    SignalDetectionTypes.SignalDetection
  >(sortByArrivalTime, [
    sd =>
      // eslint-disable-next-line no-nested-ternary
      waveformSortType === AnalystWorkspaceTypes.WaveformSortType.distance
        ? distances.find(d => d.stationId === sd.stationName)
          ? distances.find(d => d.stationId === sd.stationName).distance
          : 0
        : sd.stationName
  ]);
  return sortedEntries;
}

/**
 * Filter the signal detections for a given station.
 *
 * @param stationId the station is
 * @param signalDetectionsByStation the signal detections to filter
 */
export function filterSignalDetectionsByStationId(
  stationId: string,
  signalDetectionsByStation: SignalDetectionTypes.SignalDetection[]
): SignalDetectionTypes.SignalDetection[] {
  return signalDetectionsByStation.filter(sd => {
    // filter out the sds for the other stations and the rejected sds
    if (sd.stationName !== stationId || sd.currentHypothesis.rejected) {
      return false;
    }
    return true; // return all other sds
  });
}

/**
 * Returns the signal detection beams for given waveform filter.
 *
 * @param signalDetections the signal detections
 * @param waveformFilter the waveform filter to get beams for
 */
export function getSignalDetectionChannelSegments(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  waveformFilter: Partial<WaveformTypes.WaveformFilter>
): WeavessTypes.ChannelSegment | undefined {
  const waveforms = getSignalDetectionBeams(signalDetections, waveformFilter);
  const filterSampleRate =
    waveformFilter.sampleRate !== undefined ? ` ${waveformFilter.sampleRate} ` : '';

  // If there are waveforms then there are SignalDetections to get the StationName from
  return waveforms.length !== 0
    ? {
        channelName: signalDetections[0].stationName,
        wfFilterId: waveformFilter.name,
        description: `${waveformFilter.name}${filterSampleRate}`,
        descriptionLabelColor: gmsColors.gmsMain,
        dataSegments: waveforms.map(t => ({
          displayType: [WeavessTypes.DisplayType.LINE],
          pointSize: 1,
          data: {
            startTimeSecs: t.startTime,
            endTimeSecs: t.endTime,
            color: semanticColors.waveformRaw,
            sampleRate: waveforms[0].sampleRateHz,
            values: t.samples
          }
        }))
      }
    : undefined;
}

/**
 * Checks if the passed in sds are in conflict AND not associated to the open event
 *
 * @param sds sds to check
 * @param openEvent open event
 */
export function isInConflictAndNotAssociatedToOpenEvent(
  sds: SignalDetectionTypes.SignalDetection[],
  openEvent: EventTypes.Event
): boolean {
  return sds
    .map(
      sd => sd.hasConflict && !isAssociatedToCurrentEventHypothesis(sd.currentHypothesis, openEvent)
    )
    .reduce((accum, val) => accum || val, false);
}

/**
 * Checks if the passed in sds are in conflict AND not associated to the open event
 *
 * @param sds sds to check
 * @param openEvent open event
 */
export function isInConflict(sds: SignalDetectionTypes.SignalDetection[]): boolean {
  return sds.map(sd => sd.hasConflict).reduce((accum, val) => accum || val, false);
}

/**
 * Returns true if te provided signal detection hypothesis is associated
 * to the provided event; false otherwise.
 *
 * @param sdHypothesis the signal detection hypothesis to check
 * @param event the event to check association status
 * @returns true if the signal detection hypothesis is associated
 * to the provided event; false otherwise.
 */
export function isAssociatedToCurrentEventHypothesis(
  sdHypothesis: SignalDetectionTypes.SignalDetectionHypothesis,
  event: EventTypes.Event
): boolean {
  if (!event) {
    return false;
  }
  let isAssociated = false;
  event.currentEventHypothesis.eventHypothesis.signalDetectionAssociations.forEach(sdAssoc => {
    if (sdAssoc.signalDetectionHypothesis.id === sdHypothesis.id && !sdAssoc.rejected) {
      isAssociated = true;
    }
  });
  return isAssociated;
}
