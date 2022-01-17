import { CommonTypes, WaveformTypes } from '@gms/common-model';
import Immutable from 'immutable';
import clone from 'lodash/clone';
import uniq from 'lodash/uniq';
import * as Redux from 'redux';

import { Actions, Internal } from './actions';
import * as Types from './types';
import { Reducer as WorkflowReducer } from './workflow/reducers';

/**
 * Redux reducer for setting the mode.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setMode = (
  state: Types.WaveformDisplayMode = Types.WaveformDisplayMode.DEFAULT,
  action: Types.SET_MODE
): Types.WaveformDisplayMode => {
  if (Internal.setMode.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the signal detection default phase.
 * The selected phase type that will be used for the creation of
 * a new a signal detection.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setDefaultSignalDetectionPhase = (
  state: CommonTypes.PhaseType = CommonTypes.PhaseType.P,
  action: Types.SET_DEFAULT_SIGNAL_DETECTION_PHASE
): CommonTypes.PhaseType => {
  if (Actions.setDefaultSignalDetectionPhase.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the selected event ids.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setSelectedEventIds = (
  state: string[] = [],
  action: Types.SET_SELECTED_EVENT_IDS
): string[] => {
  if (Actions.setSelectedEventIds.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the current open event id.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setOpenEventId = (state: string = null, action: Types.SET_OPEN_EVENT_ID): string => {
  if (Internal.setOpenEventId.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the selected signal detection ids.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setSelectedSdIds = (state: string[] = [], action: Types.SET_SELECTED_SD_IDS): string[] => {
  if (Actions.setSelectedSdIds.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the signal detection ids that
 * have been marked to show FK.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setSdIdsToShowFk = (state: string[] = [], action: Types.SET_SD_IDS_TO_SHOW_FK): string[] => {
  if (Actions.setSdIdsToShowFk.test(action)) {
    return action.payload ? uniq(action.payload) : null;
  }
  return state;
};

/**
 * Redux reducer for setting the selected sort type.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setSelectedSortType = (
  state: Types.WaveformSortType = Types.WaveformSortType.stationName,
  action: Types.SET_SELECTED_SORT_TYPE
): Types.WaveformSortType => {
  if (Actions.setSelectedSortType.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the channel filters.
 * (selected waveform filter for a give channel id)
 *
 * @param state the state to set
 * @param action the redux action
 */
const setChannelFilters = (
  state: Immutable.Map<string, WaveformTypes.WaveformFilter> = Immutable.Map<
    string,
    WaveformTypes.WaveformFilter
  >(),
  action: Types.SET_CHANNEL_FILTERS
): Immutable.Map<string, WaveformTypes.WaveformFilter> => {
  if (Actions.setChannelFilters.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the measurement mode entries.
 * Map of signal detection ids to boolean value indicating if the
 * amplitude measurement should be displayed (visible).
 *
 * @param state the state to set
 * @param action the redux action
 */
const setMeasurementModeEntries = (
  state: Immutable.Map<string, boolean> = Immutable.Map<string, boolean>(),
  action: Types.SET_MEASUREMENT_MODE_ENTRIES
): Immutable.Map<string, boolean> => {
  if (Internal.setMeasurementModeEntries.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the selected location solution set id.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setSelectedLocationSolutionSetId = (
  state: string = null,
  action: Types.SET_SELECTED_LOCATION_SOLUTION_SET_ID
): string => {
  if (Internal.setSelectedLocationSolutionSetId.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the selected location solution id.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setSelectedLocationSolutionId = (
  state: string = null,
  action: Types.SET_SELECTED_LOCATION_SOLUTION_ID
): string => {
  if (Internal.setSelectedLocationSolutionId.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the selected preferred location solution set id.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setSelectedPreferredLocationSolutionSetId = (
  state: string = null,
  action: Types.SET_SELECTED_PREFERRED_LOCATION_SOLUTION_SET_ID
): string => {
  if (Internal.setSelectedPreferredLocationSolutionSetId.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting the selected preferred location solution id.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setSelectedPreferredLocationSolutionId = (
  state: string = null,
  action: Types.SET_SELECTED_PREFERRED_LOCATION_SOLUTION_ID
): string => {
  if (Internal.setSelectedPreferredLocationSolutionId.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * The location solution state reducer.
 */
const locationReducer: Redux.Reducer<
  Types.LocationSolutionState,
  Redux.AnyAction
> = Redux.combineReducers({
  selectedLocationSolutionSetId: setSelectedLocationSolutionSetId,
  selectedLocationSolutionId: setSelectedLocationSolutionId,
  selectedPreferredLocationSolutionSetId: setSelectedPreferredLocationSolutionSetId,
  selectedPreferredLocationSolutionId: setSelectedPreferredLocationSolutionId
});

/**
 * Measurement mode reducer.
 */
const measurementModeReducer: Redux.Reducer<
  Types.MeasurementMode,
  Redux.AnyAction
> = Redux.combineReducers({
  mode: setMode,
  entries: setMeasurementModeEntries
});

/**
 * Redux reducer for setting the open layout id.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setOpenLayoutName = (state: string = null, action: Types.SET_OPEN_LAYOUT_NAME): string => {
  if (Actions.setOpenLayoutName.test(action)) {
    return action.payload ? action.payload : null;
  }
  return state;
};

/**
 * Redux reducer for setting if a history action is in progress
 *
 * @param state the state to set
 * @param action the redux action
 */
const handleHistoryAction = (
  state = 0,
  action: Types.INCREMENT_HISTORY_ACTION_IN_PROGRESS | Types.DECREMENT_HISTORY_ACTION_IN_PROGRESS
): number => {
  if (Actions.incrementHistoryActionInProgress.test(action)) {
    return state + 1;
  }
  if (Actions.decrementHistoryActionInProgress.test(action)) {
    return state - 1;
  }
  return state;
};

/**
 * Redux reducer for setting the waveform client state in Redux.
 *
 * @param state the state to set
 * @param action the redux action
 */
const setWaveformClientLoadingState = (
  state: Types.WaveformClientState = Types.DEFAULT_INITIAL_WAVEFORM_CLIENT_STATE,
  action: Types.SET_WAVEFORM_CLIENT_LOADING_STATE
): Types.WaveformClientState => {
  // Clone updated loading state so Redux will cause loading indicator to update
  if (Actions.setWaveformClientLoadingState.test(action)) {
    return action.payload ? clone(action.payload) : null;
  }
  return state;
};

/**
 * Store the waveform client in the redux store.
 * Note that it will create a shallow clone of the client passed in
 * to ensure that changes to the waveform client will
 * propagate changes in the React DOM.
 *
 * @param state the waveform client to set
 * @param action the type of action being dispatched, to test to see if it is a SET_WAVEFORM_CLIENT action
 * @returns a waveform client to update in the store
 */
const setWaveformClient = (
  state: Types.WaveformClient = null,
  action: Types.SET_WAVEFORM_CLIENT
): Types.WaveformClient => {
  // Clone updated loading state so Redux will cause loading indicator to update
  if (Actions.setWaveformClient.test(action)) {
    return action.payload ? clone(action.payload) : null;
  }
  return state;
};

/**
 * Analyst workspace reducer.
 */
export const Reducer: Redux.Reducer<
  Types.AnalystWorkspaceState,
  Redux.AnyAction
> = Redux.combineReducers({
  defaultSignalDetectionPhase: setDefaultSignalDetectionPhase,
  selectedEventIds: setSelectedEventIds,
  openEventId: setOpenEventId,
  selectedSdIds: setSelectedSdIds,
  sdIdsToShowFk: setSdIdsToShowFk,
  selectedSortType: setSelectedSortType,
  channelFilters: setChannelFilters,
  measurementMode: measurementModeReducer,
  location: locationReducer,
  openLayoutName: setOpenLayoutName,
  historyActionInProgress: handleHistoryAction,
  waveformClientLoadingState: setWaveformClientLoadingState,
  waveformClient: setWaveformClient,
  workflowState: WorkflowReducer
});
