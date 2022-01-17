import {
  CommonTypes,
  EventTypes,
  QcMaskTypes,
  SignalDetectionTypes,
  StationTypes,
  WaveformTypes,
  WorkflowTypes
} from '@gms/common-model';
import GoldenLayout from '@gms/golden-layout';
import { AnalystWorkspaceTypes } from '@gms/ui-state';
import { WaveformDisplayProps as WeavessProps } from '@gms/weavess/lib/components/waveform-display/types';
import Immutable from 'immutable';
import { MutationFunction } from 'react-query';

import {
  AmplitudeScalingOptions,
  FixedScaleValue
} from '../components/waveform-controls/scaling-options';

export interface WeavessDisplayState {
  qcMaskModifyInterval?: CommonTypes.TimeRange;
  selectedQcMask?: QcMaskTypes.QcMask;
  /**
   * The anchor for the channel selection range: this defines the starting point for a range selection.
   */
  selectionRangeAnchor: string;
}

interface WeavessDisplayReduxProps {
  // passed in from golden-layout
  glContainer?: GoldenLayout.Container;
  currentTimeInterval: CommonTypes.TimeRange;
  currentOpenEventId: string;
  selectedSdIds: string[];
  analysisMode: WorkflowTypes.AnalysisMode;
  sdIdsToShowFk: string[];
  selectedStationIds: string[];

  // callbacks
  setMode(mode: AnalystWorkspaceTypes.WaveformDisplayMode): void;
  setOpenEventId(event: EventTypes.Event): void;
  setSelectedSdIds(id: string[]): void;
  setSelectedStationIds(ids: string[]): void;
  setSdIdsToShowFk(signalDetections: string[]): void;
}

interface WeavessDisplayMutations {
  createSignalDetection: MutationFunction<unknown, unknown>;
  rejectSignalDetection: MutationFunction<unknown, unknown>;
  updateSignalDetection: MutationFunction<unknown, unknown>;
  createQcMask: MutationFunction<unknown, unknown>;
  updateQcMask: MutationFunction<unknown, unknown>;
  rejectQcMask: MutationFunction<unknown, unknown>;
  createEvent: MutationFunction<unknown, unknown>;
  setEventSignalDetectionAssociation: MutationFunction<unknown, unknown>;
}

export interface WeavessDisplayComponentProps {
  weavessProps: WeavessProps;
  defaultWaveformFilters: WaveformTypes.WaveformFilter[];
  defaultStations: StationTypes.Station[];
  defaultSignalDetectionPhase?: CommonTypes.PhaseType;
  eventsInTimeRange: EventTypes.Event[];
  signalDetectionsByStation: SignalDetectionTypes.SignalDetection[];
  qcMasksByChannelName: QcMaskTypes.QcMask[];
  measurementMode: AnalystWorkspaceTypes.MeasurementMode;
  setMeasurementModeEntries(entries: Immutable.Map<string, boolean>): void;
  amplitudeScaleOption?: AmplitudeScalingOptions;
  fixedScaleVal?: FixedScaleValue;
}

export type WeavessDisplayProps = WeavessDisplayReduxProps &
  WeavessDisplayMutations &
  WeavessDisplayComponentProps;
