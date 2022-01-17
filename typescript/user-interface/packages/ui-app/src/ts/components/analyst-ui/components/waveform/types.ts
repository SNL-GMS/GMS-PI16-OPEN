import { CommonTypes, EventTypes, WaveformTypes, WorkflowTypes } from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { AnalystWorkspaceTypes, CommonWorkspaceTypes } from '@gms/ui-state';
import { WeavessTypes } from '@gms/weavess-core';
import Immutable from 'immutable';
import { MutationFunction } from 'react-query';

import { QcMaskDisplayFilters } from '~components/analyst-ui/config';
import { QueryAndMutationTypes } from '~components/client-interface';

import {
  AmplitudeScalingOptions,
  FixedScaleValue
} from './components/waveform-controls/scaling-options';

export enum PhaseAlignments {
  PREDICTED_PHASE = 'Predicted',
  OBSERVED_PHASE = 'Observed'
}

export enum AlignWaveformsOn {
  TIME = 'Time',
  PREDICTED_PHASE = 'Predicted',
  OBSERVED_PHASE = 'Observed'
}

export enum KeyDirection {
  UP = 'Up',
  DOWN = 'Down',
  LEFT = 'Left',
  RIGHT = 'Right'
}

/**
 * Waveform Display display state.
 * keep track of selected channels & signal detections
 */
export interface WaveformDisplayState {
  weavessStations: WaveformWeavessStation[];
  currentTimeInterval: CommonTypes.TimeRange;
  // because the user may load more waveform
  // data than the currently opened time interval
  viewableInterval: WeavessTypes.TimeRange;
  loadingWaveforms: boolean;
  loadingWaveformsPercentComplete: number;
  maskDisplayFilters: QcMaskDisplayFilters;
  analystNumberOfWaveforms: number;
  currentOpenEventId: string;
  showPredictedPhases: boolean;
  alignWaveformsOn: AlignWaveformsOn;
  phaseToAlignOn: CommonTypes.PhaseType | undefined;
  isMeasureWindowVisible: boolean;
  amplitudeScaleOption: AmplitudeScalingOptions;
  fixedScaleVal: FixedScaleValue;
}

/**
 * Props mapped in from Redux state
 */
export interface WaveformDisplayReduxProps {
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
  currentTimeInterval: CommonTypes.TimeRange;
  defaultSignalDetectionPhase: CommonTypes.PhaseType;
  currentOpenEventId: string;
  selectedSdIds: string[];
  stationsVisibility: Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject>;
  selectedStationIds: string[];
  selectedSortType: AnalystWorkspaceTypes.WaveformSortType;
  analysisMode: WorkflowTypes.AnalysisMode;
  measurementMode: AnalystWorkspaceTypes.MeasurementMode;
  sdIdsToShowFk: string[];
  location: AnalystWorkspaceTypes.LocationSolutionState;
  channelFilters: Immutable.Map<string, WaveformTypes.WaveformFilter>;
  openEventId: string;
  keyPressActionQueue: Immutable.Map<string, number>;
  waveformClient: AnalystWorkspaceTypes.WaveformClient;

  // callbacks
  setDefaultSignalDetectionPhase(phase: CommonTypes.PhaseType): void;
  setMode(mode: AnalystWorkspaceTypes.WaveformDisplayMode): void;
  setOpenEventId(
    event: EventTypes.Event | undefined,
    latestLocationSolutionSet: EventTypes.LocationSolutionSet | undefined,
    preferredLocationSolutionId: string | undefined
  ): void;
  setSelectedSdIds(idx: string[]): void;
  setSdIdsToShowFk(signalDetections: string[]): void;
  setSelectedSortType(selectedSortType: AnalystWorkspaceTypes.WaveformSortType): void;
  setChannelFilters(filters: Immutable.Map<string, WaveformTypes.WaveformFilter>);
  setMeasurementModeEntries(entries: Immutable.Map<string, boolean>): void;
  setKeyPressActionQueue(actions: Immutable.Map<string, number>): void;
  setStationsVisibility(
    stationsVisibility: Immutable.Map<string, CommonWorkspaceTypes.StationVisibilityObject>
  );
}
/**
 * Mutations used by the Waveform display
 */
export interface WaveformDisplayMutations {
  markAmplitudeMeasurementReviewed: MutationFunction<unknown, unknown>;
}

/**
 * Consolidated props type for waveform display.
 */
export type WaveformDisplayProps = WaveformDisplayReduxProps &
  WaveformDisplayMutations &
  QueryAndMutationTypes.ProcessingAnalystConfigurationQueryProps &
  QueryAndMutationTypes.EventQueryProps &
  QueryAndMutationTypes.SignalDetectionsQueryProps &
  QueryAndMutationTypes.StationDefinitionQueryProps &
  QueryAndMutationTypes.QCMaskQueryProps;
// Enum to clarify pan button interactions
export enum PanType {
  Left,
  Right
}

/**
 * Station configuration using the Waveform definition of WeavessChannel
 */
export interface WaveformWeavessStation extends WeavessTypes.Station {
  /** Default channel information for station */
  defaultChannel: WaveformWeavessChannel;

  /** Non-default channels for station */
  nonDefaultChannels?: WaveformWeavessChannel[];
}

/**
 * Channel configuration adding the isChannelVisible attribute to WeavessTypes.Channel
 */
export interface WaveformWeavessChannel extends WeavessTypes.Channel {
  isChannelVisibleInWeavess: boolean;
}
