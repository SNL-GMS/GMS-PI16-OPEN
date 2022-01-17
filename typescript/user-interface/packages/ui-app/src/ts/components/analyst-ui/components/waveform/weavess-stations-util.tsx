/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  ChannelTypes,
  CommonTypes,
  EventTypes,
  QcMaskTypes,
  SignalDetectionTypes,
  StationTypes,
  WaveformTypes
} from '@gms/common-model';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import { WeavessTypes } from '@gms/weavess-core';
import Immutable from 'immutable';
import clone from 'lodash/clone';
import flatMap from 'lodash/flatMap';
import includes from 'lodash/includes';
import isEqual from 'lodash/isEqual';
import orderBy from 'lodash/orderBy';
import sortBy from 'lodash/sortBy';
import memoizeOne from 'memoize-one';
import React from 'react';

import { SignalDetectionUtils } from '~analyst-ui/common/utils';
import { getDistanceToStationsForLocationSolutionId } from '~analyst-ui/common/utils/event-util';
import { isSdInstantMeasurementValue } from '~analyst-ui/common/utils/instance-of-util';
import {
  determineDetectionColor,
  determineIfAssociated,
  filterSignalDetectionsByStationId,
  getSignalDetectionChannelSegments,
  isPeakTroughInWarning
} from '~analyst-ui/common/utils/signal-detection-util';
import { getSelectedWaveformFilter } from '~analyst-ui/common/utils/waveform-util';
import { QcMaskDisplayFilters, systemConfig, userPreferences } from '~analyst-ui/config';
import { semanticColors } from '~scss-config/color-preferences';

import {
  AlignWaveformsOn,
  WaveformDisplayProps,
  WaveformDisplayState,
  WaveformWeavessChannel,
  WaveformWeavessStation
} from './types';
import { calculateOffsets, Offset } from './utils';

/**
 * Interface used to bundle all of the parameters need to create the
 * weavess stations for the waveform display.
 */
export interface CreateWeavessStationsParameters {
  defaultStations: StationTypes.Station[];
  measurementMode: AnalystWorkspaceTypes.MeasurementMode;
  featurePredictions: EventTypes.FeaturePrediction[];
  signalDetectionsByStation: SignalDetectionTypes.SignalDetection[];
  eventsInTimeRange: EventTypes.Event[];
  qcMasksByChannelName: QcMaskTypes.QcMask[];
  channelHeight: number;
  maskDisplayFilters: QcMaskDisplayFilters;
  channelFilters: Immutable.Map<string, WaveformTypes.WaveformFilter>;
  waveformClient: AnalystWorkspaceTypes.WaveformClient;
  defaultWaveformFilters: WaveformTypes.WaveformFilter[];
  startTimeSecs: number;
  endTimeSecs: number;
  currentOpenEvent?: EventTypes.Event;
  showPredictedPhases: boolean;
  distances: EventTypes.LocationToStationDistance[];
  offsets: Offset[];
}

/**
 * Creates CreateWeavessStationsParameters with the required fields used
 * for to creating the weavess stations for the waveform display.
 *
 * @param props The WaveformDisplayProps
 * @param state The WaveformDisplayState
 * @param channelHeight The height of rendered channels in weavess in px
 * @param waveformClient A reference to an instantiated WaveformClient object
 * @returns CreateWeavessStationsParameters
 */
export function populateCreateWeavessStationsParameters(
  props: WaveformDisplayProps,
  state: WaveformDisplayState,
  channelHeight: number,
  waveformClient: AnalystWorkspaceTypes.WaveformClient
): CreateWeavessStationsParameters {
  const events = [];

  const currentOpenEvent = events.find(event => event.id === state.currentOpenEventId);

  const signalDetectionsByStation = [];

  const theStations = props.stationDefinitionsQuery?.data ?? [];
  const filteredStations =
    // filter the stations based on the mode setting
    theStations.filter(stationToFilterOnMode =>
      filterStationOnMode(
        props.measurementMode.mode,
        stationToFilterOnMode,
        currentOpenEvent,
        signalDetectionsByStation
      )
    );

  const distances = getDistanceToStationsForLocationSolutionId(
    currentOpenEvent,
    props.location.selectedPreferredLocationSolutionId
  );
  const sortedFilteredDefaultStations = currentOpenEvent
    ? sortProcessingStations(filteredStations, props.selectedSortType, distances)
    : filteredStations;

  const fpList = getFeaturePredictionsForOpenEvent(props.currentOpenEventId, props.eventQuery?.data)
    .filter(
      fp => fp.predictionType === SignalDetectionTypes.FeatureMeasurementTypeName.ARRIVAL_TIME
    )
    .filter(fpToFilter =>
      filterFeaturePredictionsOnMode(
        props.measurementMode.mode,
        fpToFilter,
        sortedFilteredDefaultStations
      )
    );

  const individualWeavesMeasurementMode: AnalystWorkspaceTypes.MeasurementMode = {
    mode: props.measurementMode.mode,
    entries: props.measurementMode.entries
  };

  const params: CreateWeavessStationsParameters = {
    defaultStations: sortedFilteredDefaultStations,
    measurementMode: individualWeavesMeasurementMode,
    featurePredictions: fpList,
    signalDetectionsByStation,
    eventsInTimeRange: events,
    qcMasksByChannelName: [],
    channelHeight,
    maskDisplayFilters: state.maskDisplayFilters,
    channelFilters: props.channelFilters,
    waveformClient,
    defaultWaveformFilters: props.processingAnalystConfigurationQuery?.data?.defaultFilters,
    startTimeSecs: props.currentTimeInterval.startTimeSecs,
    endTimeSecs: props.currentTimeInterval.endTimeSecs,
    currentOpenEvent,
    distances,
    showPredictedPhases: state.showPredictedPhases,
    offsets:
      // eslint-disable-next-line no-nested-ternary
      state.alignWaveformsOn === AlignWaveformsOn.TIME
        ? []
        : sortedFilteredDefaultStations !== undefined && sortedFilteredDefaultStations.length > 0
        ? calculateOffsets(
            fpList,
            sortedFilteredDefaultStations[0].allRawChannels[0].name,
            state.phaseToAlignOn
          )
        : []
  };
  return params;
}

/**
 * Filter the feature predictions based on the mode setting.
 *
 * @param mode the mode of the waveform display
 * @param featurePrediction the feature prediction to check
 * @param stations the stations
 */
function filterFeaturePredictionsOnMode(
  mode: AnalystWorkspaceTypes.WaveformDisplayMode,
  featurePrediction: EventTypes.FeaturePrediction,
  stations: StationTypes.Station[]
): boolean {
  if (AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT === mode) {
    return stations.find(station => station.name === featurePrediction.stationName) !== undefined;
  }
  return true; // show all feature predictions (DEFAULT)
}

/**
 * Filter the stations based on the mode setting.
 *
 * @param mode the mode of the waveform display
 * @param station the station
 * @param signalDetectionsByStation the signal detections for all stations
 */
function filterStationOnMode(
  mode: AnalystWorkspaceTypes.WaveformDisplayMode,
  station: StationTypes.Station,
  currentOpenEvent: EventTypes.Event,
  signalDetectionsByStation: SignalDetectionTypes.SignalDetection[]
): boolean {
  if (AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT === mode) {
    if (currentOpenEvent) {
      // eslint-disable-next-line max-len
      const associatedSignalDetectionHypothesisIds = currentOpenEvent.currentEventHypothesis.eventHypothesis.signalDetectionAssociations.map(
        association => association.signalDetectionHypothesis.id
      );

      const signalDetections = signalDetectionsByStation
        ? signalDetectionsByStation.filter(sd => {
            // filter out the sds for the other stations and the rejected sds
            if (sd.stationName !== station.name || sd.currentHypothesis.rejected) {
              return false;
            }

            // filter sds that are associated to the current open event
            if (includes(associatedSignalDetectionHypothesisIds, sd.currentHypothesis.id)) {
              return true;
            }

            return false;
          })
        : [];
      // display the station only if sds were returned
      return signalDetections.length > 0;
    }
  }

  return true; // show all stations (DEFAULT)
}

/**
 * Returns the `green` interval markers.
 *
 * @param startTimeSecs start time seconds for the interval start marker
 * @param endTimeSecs end time seconds for the interval end marker
 */
function getIntervalMarkers(startTimeSecs: number, endTimeSecs: number): WeavessTypes.Marker[] {
  return [
    {
      id: 'startTime',
      color: semanticColors.waveformIntervalBoundry,
      lineStyle: WeavessTypes.LineStyle.SOLID,
      timeSecs: startTimeSecs
    },
    {
      id: 'endTime',
      color: semanticColors.waveformIntervalBoundry,
      lineStyle: WeavessTypes.LineStyle.SOLID,
      timeSecs: endTimeSecs
    }
  ];
}

/**
 * If there are Signal Detections populate Weavess Channel Segment from the FK_BEAM
 * else use the default channel Weavess Channel Segment built
 *
 * @param signalDetections signal detections
 * @param defaultWaveformFilters default waveform filters
 * @param channelSegments channel segment map
 */
export function populateWeavessChannelSegmentAndAddFilter(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  defaultWaveformFilters: WaveformTypes.WaveformFilter[],
  channelSegments: Map<string, WeavessTypes.ChannelSegment>
): void {
  if (signalDetections && signalDetections.length > 0) {
    // clone to add UNFILTERED
    const allFilters = [...defaultWaveformFilters, WaveformTypes.UNFILTERED_FILTER];
    allFilters.forEach(filter => {
      const signalDetectionChannelSegments = getSignalDetectionChannelSegments(
        signalDetections,
        filter
      );
      if (
        signalDetectionChannelSegments &&
        signalDetectionChannelSegments.dataSegments &&
        signalDetectionChannelSegments.dataSegments.length > 0
      ) {
        channelSegments.set(filter.id, signalDetectionChannelSegments);
      }
    });
  }
}

/**
 * Creates the selection window and markers for weavess
 *
 * @param signalDetections signal detections
 * @param currentOpenEvent the current open event
 * @param measurementMode measurement mode
 *
 * @returns a WeavessTypes.SelectionWindow[]
 */
export function generateSelectionWindows(
  signalDetections: SignalDetectionTypes.SignalDetection[],
  currentOpenEvent: EventTypes.Event,
  measurementMode: AnalystWorkspaceTypes.MeasurementMode
): WeavessTypes.SelectionWindow[] {
  const selectionWindows: WeavessTypes.SelectionWindow[] = flatMap(
    // eslint-disable-next-line complexity
    signalDetections.map(sd => {
      const associatedSignalDetectionHypothesisIds = currentOpenEvent
        ? currentOpenEvent.currentEventHypothesis.eventHypothesis.signalDetectionAssociations.map(
            association => association.signalDetectionHypothesis.id
          )
        : [];

      const arrivalTime: number = SignalDetectionUtils.findArrivalTimeFeatureMeasurementValue(
        sd.currentHypothesis.featureMeasurements
      ).value;

      const { phase } = SignalDetectionUtils.findPhaseFeatureMeasurementValue(
        sd.currentHypothesis.featureMeasurements
      );

      const isSdAssociatedToOpenEvent =
        includes(associatedSignalDetectionHypothesisIds, sd.currentHypothesis.id) &&
        // sd must have phase type that is contained in the measurement mode phase filter list
        includes(systemConfig.measurementMode.phases, phase);

      const isManualShow = [...measurementMode.entries.entries()]
        .filter(({ 1: v }) => v)
        .map(([k]) => k)
        .find(id => id === sd.id);

      const isManualHide = [...measurementMode.entries.entries()]
        .filter(({ 1: v }) => !v)
        .map(([k]) => k)
        .find(id => id === sd.id);

      const amplitudeMeasurementValue = SignalDetectionUtils.findAmplitudeFeatureMeasurementValue(
        sd.currentHypothesis.featureMeasurements,
        SignalDetectionTypes.FeatureMeasurementTypeName.AMPLITUDE_A5_OVER_2
      );

      const selectionStartOffset: number =
        systemConfig.measurementMode.selection.startTimeOffsetFromSignalDetection;
      const selectionEndOffset: number =
        systemConfig.measurementMode.selection.endTimeOffsetFromSignalDetection;

      // display the measurement selection windows if the sd is associated
      // to the open event and its phase is included in one of the measurement mode phases
      if (
        (measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT &&
          isSdAssociatedToOpenEvent &&
          !isManualHide) ||
        isManualShow
      ) {
        const selections: WeavessTypes.SelectionWindow[] = [];
        selections.push({
          id: `${systemConfig.measurementMode.selection.id}${sd.id}`,
          startMarker: {
            id: 'start',
            color: systemConfig.measurementMode.selection.borderColor,
            lineStyle: systemConfig.measurementMode.selection.lineStyle,
            timeSecs: arrivalTime + selectionStartOffset
          },
          endMarker: {
            id: 'end',
            color: systemConfig.measurementMode.selection.borderColor,
            lineStyle: systemConfig.measurementMode.selection.lineStyle,
            timeSecs: arrivalTime + selectionEndOffset
          },
          isMoveable: systemConfig.measurementMode.selection.isMoveable,
          color: systemConfig.measurementMode.selection.color
        });

        if (amplitudeMeasurementValue) {
          const { period } = amplitudeMeasurementValue;
          const troughTime: number = amplitudeMeasurementValue.startTime;
          const peakTime = troughTime + period / 2; // display only period/2
          const isWarning = isPeakTroughInWarning(arrivalTime, period, troughTime, peakTime);

          const isMoveable =
            measurementMode.mode === AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT &&
            systemConfig.measurementMode.peakTroughSelection.isMoveable;
          selections.push({
            id: `${systemConfig.measurementMode.peakTroughSelection.id}${sd.id}`,
            startMarker: {
              id: 'start',
              color: !isWarning
                ? systemConfig.measurementMode.peakTroughSelection.borderColor
                : systemConfig.measurementMode.peakTroughSelection.warning.borderColor,
              lineStyle: isMoveable
                ? systemConfig.measurementMode.peakTroughSelection.lineStyle
                : systemConfig.measurementMode.peakTroughSelection.nonMoveableLineStyle,
              timeSecs: troughTime,
              minTimeSecsConstraint: arrivalTime + selectionStartOffset
            },
            endMarker: {
              id: 'end',
              color: !isWarning
                ? systemConfig.measurementMode.peakTroughSelection.borderColor
                : systemConfig.measurementMode.peakTroughSelection.warning.borderColor,
              lineStyle: isMoveable
                ? systemConfig.measurementMode.peakTroughSelection.lineStyle
                : systemConfig.measurementMode.peakTroughSelection.nonMoveableLineStyle,
              timeSecs: peakTime,
              maxTimeSecsConstraint: arrivalTime + selectionEndOffset
            },
            isMoveable,
            color: !isWarning
              ? systemConfig.measurementMode.peakTroughSelection.color
              : systemConfig.measurementMode.peakTroughSelection.warning.color
          });
        }
        return selections;
      }
      return [];
    })
  );
  return selectionWindows;
}

/**
 * Creates a station for weavess with the waveform data map
 *
 * @param station station
 * @param selectedFilter selected filter
 * @param channelSegments channel segment map
 * @param signalDetections signal detections
 * @param params CreateWeavessStationsParameters the parameters required for
 *
 * @returns a WaveformWeavessStation
 */
export function createWeavessStation(
  station: StationTypes.Station,
  selectedFilter: WaveformTypes.WaveformFilter,
  channelSegments: Map<string, WeavessTypes.ChannelSegment>,
  signalDetections: SignalDetectionTypes.SignalDetection[],
  params: CreateWeavessStationsParameters
): WaveformWeavessStation {
  const distanceToEvent = params.distances
    ? params.distances.find(d => d.stationId === station.name)
    : undefined;

  const weavessStation: WaveformWeavessStation = {
    id: station.name,
    name: station.name,
    distance: distanceToEvent ? distanceToEvent.distance.degrees : 0,
    distanceUnits: userPreferences.distanceUnits,
    defaultChannel: createWeavessDefaultChannel(
      station,
      selectedFilter,
      channelSegments,
      signalDetections,
      params
    ),
    nonDefaultChannels: createWeavessNonDefaultChannels(station, params)
  };
  return weavessStation;
}

/**
 * Get the default channel for a station.
 *
 * @param station the station to search
 * @returns the default channel
 */
export function getDefaultChannel(station: StationTypes.Station): ChannelTypes.Channel {
  return (
    station.allRawChannels.find(channel => channel.name.endsWith('Z')) ??
    station.allRawChannels.find(channel => channel.name.endsWith('H')) ??
    station.allRawChannels.find(channel => channel.name.endsWith('F')) ??
    station.allRawChannels[0]
  );
}

/**
 * Creates a default channel waveform for weavess
 *
 * @param station a processing station
 * @param selectedFilter the currently selected filter
 * @param channelSegments map of channel segments
 * @param signalDetections signal detections
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.Channel
 */
export function createWeavessDefaultChannel(
  station: StationTypes.Station,
  // These params will be used in creating default channel when we have Signal Detections
  selectedFilter: WaveformTypes.WaveformFilter,
  channelSegments: Map<string, WeavessTypes.ChannelSegment>,
  signalDetections: SignalDetectionTypes.SignalDetection[],
  params: CreateWeavessStationsParameters
): WaveformWeavessChannel {
  // Build a default channel segment to use if no Signal Detections are found
  // The segment type is FK_BEAM since that is all that is drawn on the default channels
  // TODO: Part of PI16 figure out what type of beam or raw this channel segment should be
  // TODO: by looking at the Signal Detections associated to the station.
  // TODO: if mixed type set to '*'
  // const defaultChannelName = ' fkb';

  // TODO: Delete this code when Signal Detections with FK Beams is implemented in PI16
  const stationOffset = params.offsets.find(
    offset => offset.channelId === station.allRawChannels[0].name
  );

  const defaultChannel = createWeavessNonDefaultChannel(
    getDefaultChannel(station),
    params,
    stationOffset
  );

  // defaultChannels are always visible
  defaultChannel.isChannelVisibleInWeavess = true;

  // Set the station name of the channel
  const splitName = defaultChannel.name.toString().split('.');
  defaultChannel.name = (
    <span className="station-name">
      {station.name}{' '}
      <span className="station-name__channel-name">
        {splitName[1]}.{splitName[2]}
      </span>
    </span>
  );
  defaultChannel.id = station.name;
  return defaultChannel;

  // TODO: Uncomment code when Signal Detections with FK Beams is implemented in PI16
  // const defaultChannel = {
  //   id: station.name,
  //   isChannelVisibleInWeavess: true,
  //   name: defaultChannelName ? `${station.name}${defaultChannelName}` : `${station.name}`,
  //   height: params.channelHeight,
  //   timeOffsetSeconds: stationOffset ? stationOffset.offset : 0,
  //   channelType: 'FK_BEAM',
  //   waveform: createWeavessDefaultChannelWaveform(
  //     station,
  //     signalDetections,
  //     selectedFilter,
  //     channelSegments,
  //     params
  //   )
  // };
  // return defaultChannel;
}

/**
 * Creates a non default channel for weavess
 *
 * @param station a processing station
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.Channel[]
 */
export function createWeavessNonDefaultChannels(
  station: StationTypes.Station,
  params: CreateWeavessStationsParameters
): WaveformWeavessChannel[] {
  // sds are only displayed on the default channel;
  // hide all non-default channels in measurement mode
  const stationOffset = params.offsets.find(
    offset => offset.channelId === station.allRawChannels[0].name
  );
  const nonDefaultChannels =
    AnalystWorkspaceTypes.WaveformDisplayMode.MEASUREMENT === params.measurementMode.mode
      ? []
      : station.allRawChannels.map(channel => {
          const nonDefaultChannel = createWeavessNonDefaultChannel(channel, params, stationOffset);

          nonDefaultChannel.name = (
            <span className="station-name__channel-name">{channel.name}</span>
          );
          return nonDefaultChannel;
        });
  return nonDefaultChannels;
}

/**
 * Creates a non default channel for weavess
 *
 * @param channel a processing channel
 * @param params CreateWeavessStationsParameters the parameters required for
 * @param stationOffset offset in seconds
 *
 * @returns a WeavessTypes.Channel
 */
export function createWeavessNonDefaultChannel(
  channel: ChannelTypes.Channel,
  params: CreateWeavessStationsParameters,
  stationOffset: Offset
): WaveformWeavessChannel {
  const nonDefaultChannelSegments = getChannelSegments(
    params.measurementMode.mode,
    channel.name,
    channel.nominalSampleRateHz,
    params.channelFilters,
    params.waveformClient,
    params.defaultWaveformFilters
  );

  const nonDefaultChannel: WaveformWeavessChannel = {
    id: channel.name,
    isChannelVisibleInWeavess: false,
    name: channel.name,
    timeOffsetSeconds: stationOffset ? stationOffset.offset : 0,
    height: params.channelHeight,
    waveform: createWeavessNonDefaultChannelWaveform(nonDefaultChannelSegments, channel, params)
  };
  return nonDefaultChannel;
}

/**
 * For given channelNames update nonDefaultChannels (and possibly the defaultChannel) with
 * latest ChannelSegments retrieved by the waveform client
 *
 * @param channelNames list of channels to rebuild channel is visible to Weavess
 * @param params
 * @param weavessStations list of WeavessStations to update from Waveform Panel's state
 * TODO: remove stations in PI16 when the defaultChannel shows Beams from SignalDetections
 * @param stations List of StationDefinition used to figure out which channel is also the defaultChannel
 *
 * @returns returns any updated WeavessStations along with a flag if no channels were updated due none were visible
 */
export function getStationsWithUpdatedChannelSegmentInChannel(
  channelNames: string[],
  params: CreateWeavessStationsParameters,
  weavessStations: WaveformWeavessStation[],
  stations: StationTypes.Station[]
): { weavessStations: WaveformWeavessStation[]; isUpdated: boolean } {
  let isUpdated = false;
  // If empty then return with nothing updated
  if (!channelNames || channelNames.length === 0) {
    return { weavessStations, isUpdated };
  }
  const clonedWeavessStations = clone(weavessStations);
  channelNames.forEach(channelName => {
    const newStation = getStationWithUpdatedChannelSegmentInChannel(
      channelName,
      params,
      clonedWeavessStations,
      stations
    );
    // If channel not found or channel not visible nothing to update
    if (newStation) {
      // Update list before calling with next channel
      const index = clonedWeavessStations.findIndex(ws => ws.id === newStation.id);
      clonedWeavessStations[index] = newStation;
      isUpdated = true;
    }
  });
  return { weavessStations: clonedWeavessStations, isUpdated };
}
/**
 * For given channelName update nonDefaultChannel (and possibly defaultChannel) with
 * latest ChannelSegments retrieved by the waveform client and return a new station
 * with the unchanged data copied by reference.
 *
 * @param channelName
 * @param params
 * @param weavessStations
 * @param stations
 */
export function getStationWithUpdatedChannelSegmentInChannel(
  channelName: string,
  params: CreateWeavessStationsParameters,
  weavessStations: WaveformWeavessStation[],
  stations: StationTypes.Station[]
): WaveformWeavessStation {
  // Find the Weavess station that contains the channelName and save the channel index position
  let nonDefaultChannelIndex: number;
  const originalWeavessStation = weavessStations.find(station => {
    nonDefaultChannelIndex = station.nonDefaultChannels.findIndex(chan => chan.id === channelName);
    return nonDefaultChannelIndex >= 0;
  });
  if (!originalWeavessStation) {
    return undefined;
  }
  // clone the weavess station and channel to be updated
  const weavessStation = clone(originalWeavessStation);
  const weavessChannel = clone(weavessStation.nonDefaultChannels[nonDefaultChannelIndex]);
  weavessStation.nonDefaultChannels = [...weavessStation.nonDefaultChannels];
  weavessStation.nonDefaultChannels[nonDefaultChannelIndex] = weavessChannel;

  // TODO: remove in PI16 with Signal Detections
  // Find the station that contains the channel named channelName
  let channel: ChannelTypes.Channel;
  const defaultChannelStation = stations.find(station => {
    channel = station.allRawChannels.find(chan => chan.name === channelName);
    return channel !== undefined;
  });

  // If the channel is not visible and this waveform is not the parent channel (defaultChannel)
  // then don't update the channel with the latest waveform for now (will update on channel expand)
  const defaultChannel = getDefaultChannel(defaultChannelStation);
  if (!weavessChannel?.isChannelVisibleInWeavess && defaultChannel.name !== channelName) {
    return undefined;
  }

  // If found the weavess channel, StationDefinition channel and station
  // Then update the nonDefaultChannel's waveform and if this is the same defaultChannel
  // selected then that as well
  if (weavessChannel && weavessStation) {
    const channelSegments = getChannelSegments(
      params.measurementMode.mode,
      weavessChannel.id,
      channel.nominalSampleRateHz,
      params.channelFilters,
      params.waveformClient,
      params.defaultWaveformFilters
    );

    //
    weavessChannel.waveform = createWeavessNonDefaultChannelWaveform(
      channelSegments,
      channel,
      params
    );

    // If the default channel id is the same as the weavess channel update the parent
    // TODO: Remove this code when Signal Detections are available for parent panel
    if (defaultChannel.name === channelName) {
      const newDefaultChannel = clone(weavessStation.defaultChannel);
      newDefaultChannel.waveform = weavessChannel.waveform;
      weavessStation.defaultChannel = newDefaultChannel;
    }
  }
  return weavessStation;
}

/**
 * Creates a default channel waveform for weavess
 *
 * @param station a processing station
 * @param signalDetections signal detections
 * @param selectedFilter current selected filter
 * @param channelSegments map of channel segments
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.ChannelWaveformContent
 */
export function createWeavessDefaultChannelWaveform(
  station: StationTypes.Station,
  signalDetections: SignalDetectionTypes.SignalDetection[],
  selectedFilter: WaveformTypes.WaveformFilter,
  channelSegments: Map<string, WeavessTypes.ChannelSegment>,
  params: CreateWeavessStationsParameters
): WeavessTypes.ChannelWaveformContent {
  const waveform = {
    channelSegmentId: selectedFilter ? selectedFilter.id : '',
    channelSegments,
    predictedPhases: params.showPredictedPhases
      ? params.featurePredictions
          .filter(fp => fp.stationName === station.name)
          .map((fp, index) => ({
            timeSecs: isSdInstantMeasurementValue(fp.predictedValue)
              ? fp.predictedValue.value
              : undefined,
            label: fp.phase,
            id: `${index}`,
            color: semanticColors.analystOpenEvent,
            filter: 'opacity(0.5)',
            isConflicted: false
          }))
      : [],
    signalDetections:
      station && signalDetections
        ? signalDetections.map(detection => {
            const color = determineDetectionColor(
              detection,
              params.eventsInTimeRange,
              params.currentOpenEvent ? params.currentOpenEvent.id : undefined
            );
            const isAssociatedToOpenEvent = determineIfAssociated(
              detection,
              params.eventsInTimeRange,
              params.currentOpenEvent ? params.currentOpenEvent.id : undefined
            );
            const arrivalTimeFeatureMeasurementValue = SignalDetectionUtils.findArrivalTimeFeatureMeasurementValue(
              detection.currentHypothesis.featureMeasurements
            );
            const fmPhase = SignalDetectionUtils.findPhaseFeatureMeasurementValue(
              detection.currentHypothesis.featureMeasurements
            );
            return {
              timeSecs: arrivalTimeFeatureMeasurementValue
                ? arrivalTimeFeatureMeasurementValue.value
                : 0,
              label: fmPhase.phase.toString(),
              id: detection.id,
              color,
              isConflicted: detection.hasConflict,
              isDisabled: !isAssociatedToOpenEvent && detection.hasConflict
            };
          })
        : [],
    masks: undefined,
    markers: {
      verticalMarkers: getIntervalMarkers(params.startTimeSecs, params.endTimeSecs),
      selectionWindows: generateSelectionWindows(
        signalDetections,
        params.currentOpenEvent,
        params.measurementMode
      )
    }
  };
  return waveform;
}

/**
 * Creates a non default channel waveform for weavess
 *
 * @param nonDefaultChannel non default channel
 * @param channel processing channel
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.ChannelWaveformContent
 */
export function createWeavessNonDefaultChannelWaveform(
  nonDefaultChannel: {
    channelSegmentId: string;
    channelSegments: Map<string, WeavessTypes.ChannelSegment>;
  },
  channel: ChannelTypes.Channel,
  params: CreateWeavessStationsParameters
): WeavessTypes.ChannelWaveformContent {
  const waveform = {
    channelSegmentId: nonDefaultChannel.channelSegmentId,
    channelSegments: nonDefaultChannel.channelSegments,
    // if the mask category matches the enabled masks then return the mask else skip it
    masks: channel
      ? params.qcMasksByChannelName
          .filter(m => m.channelName === channel.name)
          .filter(qcMask =>
            Object.keys(params.maskDisplayFilters).find(
              key =>
                qcMask.currentVersion.category === key && params.maskDisplayFilters[key].visible
            )
          )
          .map(qcMask => ({
            id: qcMask.id,
            startTimeSecs: qcMask.currentVersion.startTime,
            endTimeSecs: qcMask.currentVersion.endTime,
            color: userPreferences.colors.maskDisplayFilters[qcMask.currentVersion.category].color
          }))
      : undefined,
    markers: {
      verticalMarkers: getIntervalMarkers(params.startTimeSecs, params.endTimeSecs)
    }
  };
  return waveform;
}

/**
 * Creates the weavess stations for the waveform display.
 *
 * @param params CreateWeavessStationsParameters the parameters required for
 * creating the weavess stations for the waveform display.
 *
 * @returns a WeavessTypes.WeavessStation[]
 */
export function createWeavessStations(
  params: CreateWeavessStationsParameters
): WaveformWeavessStation[] {
  const weavessStations: WaveformWeavessStation[] = params.defaultStations
    // filter the stations based on the mode setting
    .filter(stationToFilterOnMode =>
      filterStationOnMode(
        params.measurementMode.mode,
        stationToFilterOnMode,
        params.currentOpenEvent,
        params.signalDetectionsByStation
      )
    )
    .map(station => {
      const selectedFilter: WaveformTypes.WaveformFilter = getSelectedWaveformFilter(
        params.measurementMode.mode,
        station.name,
        station.allRawChannels[0].nominalSampleRateHz,
        params.channelFilters,
        params.defaultWaveformFilters
      );

      const signalDetections = params.signalDetectionsByStation
        ? filterSignalDetectionsByStationId(station.name, params.signalDetectionsByStation)
        : [];

      const channelSegments = new Map<string, WeavessTypes.ChannelSegment>();

      populateWeavessChannelSegmentAndAddFilter(
        signalDetections,
        params.defaultWaveformFilters,
        channelSegments
      );
      const weavessStation = createWeavessStation(
        station,
        selectedFilter,
        channelSegments,
        signalDetections,
        params
      );

      // Sort non-default channels alphabetical
      weavessStation.nonDefaultChannels = orderBy(
        weavessStation.nonDefaultChannels,
        [chan => chan.name],
        ['asc']
      );
      return weavessStation;
    })
    .filter(weavessStation => weavessStation !== undefined);
  return weavessStations;
}

/**
 * Gets the appropriate channelSegments for the currently applied filter
 *
 * @param mode current mode
 * @param channelName Id of the channel
 * @param sampleRate the sample rate of the channel
 * @param channelFilters Mapping of ids to filters
 * @param waveformClient Reference to instantiated WaveformClient object
 * @param defaultWaveformFilters A list of filters retrieved from the gateway
 * @param startTimeSecs The start time of the channel Segments
 *
 * @returns an object containing a channelSegmentId, list of channel segments, and the type of segment
 */
export function getChannelSegments(
  mode: AnalystWorkspaceTypes.WaveformDisplayMode,
  channelName: string,
  sampleRate: number,
  channelFilters: Immutable.Map<string, WaveformTypes.WaveformFilter>,
  waveformClient: AnalystWorkspaceTypes.WaveformClient,
  defaultWaveformFilters: WaveformTypes.WaveformFilter[]
): {
  channelSegmentId: string;
  channelSegments: Map<string, WeavessTypes.ChannelSegment>;
} {
  const selectedFilter: WaveformTypes.WaveformFilter = getSelectedWaveformFilter(
    mode,
    channelName,
    sampleRate,
    channelFilters,
    defaultWaveformFilters
  );

  // Get the ChannelSegment map for the channel name from the Waveform Cache
  // The key to the map is the waveform filter name
  const channelSegments = clone(waveformClient.getWaveformEntriesForChannelId(channelName));
  return { channelSegmentId: selectedFilter?.id, channelSegments };
}

/**
 * sort WeavessStations based on SortType
 *
 * @param stations WeavessStations
 * @param waveformSortType Alphabetical or by distance to selected event
 *
 * @returns sortedWeavessStations
 */
export function sortWaveformList(
  stations: WaveformWeavessStation[],
  waveformSortType: AnalystWorkspaceTypes.WaveformSortType
): WaveformWeavessStation[] {
  // apply sort based on sort type
  let sortedStations: WaveformWeavessStation[] = [];
  // Sort by distance if in global scan
  if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.distance) {
    sortedStations = sortBy<WaveformWeavessStation>(stations, [station => station.distance]);
  } else if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.stationName) {
    sortedStations = orderBy<WaveformWeavessStation>(stations, [station => station.name], ['asc']);
  }

  return sortedStations;
}

/**
 * sort waveform list based on sort type
 *
 * @param stations StationDefinition list
 * @param waveformSortType Alphabetical or by distance to selected event
 * @distance distance to stations list
 *
 * @returns sortedWeavessStations
 */
export function sortProcessingStations(
  stations: StationTypes.Station[],
  waveformSortType: AnalystWorkspaceTypes.WaveformSortType,
  distances: EventTypes.LocationToStationDistance[]
): StationTypes.Station[] {
  // apply sort based on sort type
  let sortedStations: StationTypes.Station[] = [];
  // Sort by distance if in global scan
  if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.distance) {
    sortedStations = sortBy<StationTypes.Station>(
      stations,
      station => distances.find(source => source.stationId === station.name).distance.degrees
    );
    // For station name sort, order a-z by station config name
  } else if (waveformSortType === AnalystWorkspaceTypes.WaveformSortType.stationName) {
    sortedStations = orderBy<StationTypes.Station>(stations, [station => station.name], ['asc']);
  }
  return sortedStations;
}

/**
 * Returns Feature Predictions if there is an open event
 *
 * @param currentOpenEventId the id of the currently open event
 * @param events a list of the events from the query
 * @returns an array of feature predictions from the currently open event,
 * or an empty array if something goes wrong
 */
export function getFeaturePredictionsForOpenEvent(
  currentOpenEventId: string,
  events: EventTypes.Event[]
): EventTypes.FeaturePrediction[] {
  if (currentOpenEventId && events) {
    const openEvent = events.find(event => event.id === currentOpenEventId);
    if (openEvent) {
      return openEvent.currentEventHypothesis.eventHypothesis.preferredLocationSolution
        .locationSolution.featurePredictions;
    }
  }
  return [];
}

/**
 * Returns a list of phases that are present for FP alignment
 *
 * @param currentOpenEventId the id of the currently open event
 * @param events a list of the events from the query
 * @returns a list of phases that may be aligned
 */
function getAlignablePhases(
  currentOpenEventId: string,
  events: EventTypes.Event[]
): CommonTypes.PhaseType[] {
  return systemConfig.defaultSdPhases.filter(phase => {
    const fpList = getFeaturePredictionsForOpenEvent(currentOpenEventId, events);
    return fpList.filter(fp => fp.phase === phase).length > 0;
  });
}

const getFeaturePredictionsFromOpenEvent = (eventId: string, events: EventTypes.Event[]) =>
  events.find(event => event.id === eventId).currentEventHypothesis.eventHypothesis
    .preferredLocationSolution.locationSolution.featurePredictions;

/**
 * @param currentOpenEventId the event id. If undefined, will not rerender
 * @param events the list of events from the query
 */
export const memoizedGetAlignablePhases = memoizeOne<
  (currentOpenEventId: string, events: EventTypes.Event[]) => CommonTypes.PhaseType[]
>(
  getAlignablePhases,
  (
    [currentOpenEventId, events]: [string, EventTypes.Event[]],
    [prevOpenEventId, prevEvents]: [string, EventTypes.Event[]]
  ) => {
    if (currentOpenEventId === undefined) {
      // do not re-compute if no event is selected
      return true;
    }
    if (currentOpenEventId === prevOpenEventId) {
      const currentFeaturePredictions = getFeaturePredictionsFromOpenEvent(
        currentOpenEventId,
        events
      );
      const prevFeaturePredictions = prevEvents.find(event => event.id === currentOpenEventId);
      // feature measurements are fairly simple to compare, so isEqual shouldn't cost much
      return isEqual(currentFeaturePredictions, prevFeaturePredictions);
    }
    return false;
  }
);
