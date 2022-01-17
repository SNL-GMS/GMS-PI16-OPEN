import { CommonTypes, SignalDetectionTypes, WaveformTypes } from '@gms/common-model';
import { createEnumTypeGuard } from '@gms/common-util';
import { WeavessTypes } from '@gms/weavess-core';
import Immutable from 'immutable';

import { Action, ActionWithPayload } from '../util/action-helper';
import { WorkflowState } from './workflow/types';

export enum ActionTypes {
  SET_MODE = 'SET_MODE',
  SET_CURRENT_STAGE_INTERVAL = 'SET_CURRENT_STAGE_INTERVAL',
  SET_DEFAULT_SIGNAL_DETECTION_PHASE = 'SET_DEFAULT_SIGNAL_DETECTION_PHASE',
  SET_SELECTED_SORT_TYPE = 'SET_SORT_TYPE',
  SET_SELECTED_EVENT_IDS = 'SET_SELECTED_EVENT_IDS',
  SET_OPEN_EVENT_ID = 'SET_OPEN_EVENT_ID',
  SET_SELECTED_SD_IDS = 'SET_SELECTED_SD_IDS',
  SET_SD_IDS_TO_SHOW_FK = 'SET_SD_IDS_TO_SHOW_FK',
  SET_CHANNEL_FILTERS = 'SET_CHANNEL_FILTERS',
  SET_MEASUREMENT_MODE_ENTRIES = 'SET_MEASUREMENT_MODE_ENTRIES',
  SET_SELECTED_LOCATION_SOLUTION_SET_ID = 'SET_SELECTED_LOCATION_SOLUTION_SET_ID',
  SET_SELECTED_LOCATION_SOLUTION_ID = 'SET_SELECTED_LOCATION_SOLUTION_ID',
  SET_SELECTED_PREFERRED_LOCATION_SOLUTION_SET_ID = 'SET_SELECTED_PREFERRED_LOCATION_SOLUTION_SET_ID',
  SET_SELECTED_PREFERRED_LOCATION_SOLUTION_ID = 'SET_SELECTED_PREFERRED_LOCATION_SOLUTION_ID',
  SET_DISPLAYED_MAGNITUDE_TYPES = 'SET_DISPLAYED_MAGNITUDE_TYPES',
  SET_OPEN_LAYOUT_NAME = 'SET_OPEN_LAYOUT_NAME',
  INCREMENT_HISTORY_ACTION_IN_PROGRESS = 'INCREMENT_HISTORY_ACTION_IN_PROGRESS',
  DECREMENT_HISTORY_ACTION_IN_PROGRESS = 'DECREMENT_HISTORY_ACTION_IN_PROGRESS',
  SET_WAVEFORM_CLIENT_LOADING_STATE = 'SET_WAVEFORM_CLIENT_LOADING_STATE',
  SET_WAVEFORM_CLIENT = 'SET_WAVEFORM_CLIENT'
}

export type SET_MODE = ActionWithPayload<WaveformDisplayMode>;
export type SET_DEFAULT_SIGNAL_DETECTION_PHASE = ActionWithPayload<CommonTypes.PhaseType>;
export type SET_SELECTED_SORT_TYPE = ActionWithPayload<string[]>;
export type SET_SELECTED_EVENT_IDS = ActionWithPayload<string>;
export type SET_OPEN_EVENT_ID = ActionWithPayload<string[]>;
export type SET_SELECTED_SD_IDS = ActionWithPayload<SignalDetectionTypes.SignalDetection[]>;
export type SET_SD_IDS_TO_SHOW_FK = ActionWithPayload<WaveformSortType>;
export type SET_CHANNEL_FILTERS = ActionWithPayload<
  Immutable.Map<string, WaveformTypes.WaveformFilter>
>;
export type SET_MEASUREMENT_MODE_ENTRIES = ActionWithPayload<Immutable.Map<string, boolean>>;
export type SET_SELECTED_LOCATION_SOLUTION_SET_ID = ActionWithPayload<string>;
export type SET_SELECTED_LOCATION_SOLUTION_ID = ActionWithPayload<string>;
export type SET_SELECTED_PREFERRED_LOCATION_SOLUTION_SET_ID = ActionWithPayload<string>;
export type SET_SELECTED_PREFERRED_LOCATION_SOLUTION_ID = ActionWithPayload<string>;
export type SET_DISPLAYED_MAGNITUDE_TYPES = ActionWithPayload<DisplayedMagnitudeTypes>;
export type SET_OPEN_LAYOUT_NAME = ActionWithPayload<string>;
export type INCREMENT_HISTORY_ACTION_IN_PROGRESS = Action;
export type DECREMENT_HISTORY_ACTION_IN_PROGRESS = Action;
export type SET_WAVEFORM_CLIENT_LOADING_STATE = ActionWithPayload<WaveformClientState>;
export type SET_WAVEFORM_CLIENT = ActionWithPayload<WaveformClient>;

export enum KeyAction {
  UNDO_GLOBAL = 'History: Undo Global',
  REDO_GLOBAL = 'History: Redo Global',
  TOGGLE_FILTERS_UP = 'Toggle Channel Filter Up',
  TOGGLE_FILTERS_DOWN = 'Toggle Channel Filter Down',
  SAVE_OPEN_EVENT = 'Save Open Event',
  SAVE_ALL_EVENTS = 'Save All Events in Interval'
}

export const KeyActions: Map<string, KeyAction> = new Map([
  ['Control+KeyZ', KeyAction.UNDO_GLOBAL],
  ['Control+Shift+KeyZ', KeyAction.REDO_GLOBAL],
  ['Control+ArrowUp', KeyAction.TOGGLE_FILTERS_UP],
  ['Control+ArrowDown', KeyAction.TOGGLE_FILTERS_DOWN],
  ['Control+KeyS', KeyAction.SAVE_OPEN_EVENT],
  ['Control+Shift+KeyS', KeyAction.SAVE_ALL_EVENTS]
]);

/**
 * The display mode options for the waveform display.
 */
export enum WaveformDisplayMode {
  DEFAULT = 'Default',
  MEASUREMENT = 'Measurement'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DisplayedMagnitudeTypes = Immutable.Map<any, boolean>;

/**
 * Available waveform sort types.
 */
export enum WaveformSortType {
  distance = 'Distance',
  stationName = 'Station Name'
}

/**
 * Measurement mode state.
 */
export interface MeasurementMode {
  /** The display mode */
  mode: WaveformDisplayMode;

  /**
   * Measurement entries that are manually added or hidden by the user.
   * The key is the signal detection id
   */
  entries: Immutable.Map<string, boolean>;
}

/**
 * The location solution state.
 * Includes:
 *   * The selected location solution set and solution
 *   * The selected preferred location solution set and solution
 */
export interface LocationSolutionState {
  selectedLocationSolutionSetId: string;
  selectedLocationSolutionId: string;
  selectedPreferredLocationSolutionSetId: string;
  selectedPreferredLocationSolutionId: string;
}

/**
 * Analyst workspace state.
 */
export interface AnalystWorkspaceState {
  defaultSignalDetectionPhase: CommonTypes.PhaseType;
  selectedEventIds: string[];
  openEventId: string;
  selectedSdIds: string[];
  sdIdsToShowFk: string[];
  selectedSortType: WaveformSortType;
  channelFilters: Immutable.Map<string, WaveformTypes.WaveformFilter>;
  measurementMode: MeasurementMode;
  location: LocationSolutionState;
  openLayoutName: string;
  historyActionInProgress: number;
  waveformClientLoadingState: WaveformClientState;
  waveformClient: WaveformClient;
  workflowState: WorkflowState;
}

// Waveform Client state of loading waveforms
export interface WaveformClientState {
  isLoading: boolean;
  total: number;
  completed: number;
  percent: number;
  description: string;
}

/**
 * A waveform client interface that represents what is stored in the UI Global State Store (redux)
 */
export interface WaveformClient {
  getWaveformEntriesForChannelId: (channelId: string) => Map<string, WeavessTypes.ChannelSegment>;
  stopAndClear: () => void;
  fetchAndCacheWaveforms: (
    channelIds: string[],
    filters: WaveformTypes.WaveformFilter[],
    startTimeSecs: number,
    endTimeSecs: number,
    currentInterval: CommonTypes.TimeRange,
    action: (channelNames: string[]) => unknown,
    queuePriority?: number
  ) => Promise<void>;
}

// Initial state as well when WaveformClient loading is cancelled
export const DEFAULT_INITIAL_WAVEFORM_CLIENT_STATE: WaveformClientState = {
  isLoading: false,
  total: 0,
  completed: 0,
  percent: 0,
  description: 'Loading waveforms'
};

export const isAnalystKeyAction = createEnumTypeGuard(KeyAction);
